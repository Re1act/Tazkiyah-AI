from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
import os
from util import extract_themes_gpt, get_semantic_chunks, boost_by_tag, build_context, classify_question_spirituality, ai_refine_text
import pinecone
import openai

# Load environment variables from root .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize OpenAI and Pinecone
openai.api_key = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = "tazkiyah-books"
PINECONE_HADITHS_INDEX_NAME = "hadiths"
EMBEDDING_MODEL = "text-embedding-3-small"

pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
books_index = pc.Index(PINECONE_INDEX_NAME)
hadiths_index = pc.Index(PINECONE_HADITHS_INDEX_NAME)


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_query = data.get('question', '')
        
        if not user_query:
            return jsonify({'error': 'No question provided'}), 400
        
        # Classify question
        is_spiritual = classify_question_spirituality(user_query, openai)
        if not is_spiritual:
            # Friendly fallback response
            friendly_prompt = (
                "You are a friendly Islamic wellness assistant. Respond warmly and briefly to the user's greeting or general message."
            )
            messages = [
                {"role": "system", "content": friendly_prompt},
                {"role": "user", "content": user_query}
            ]
            def generate_friendly():
                response = openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=100,
                    temperature=0.7,
                    stream=True
                )
                for chunk in response:
                    delta = chunk.choices[0].delta
                    if hasattr(delta, 'content') and delta.content:
                        yield delta.content
            return Response(stream_with_context(generate_friendly()), mimetype='text/plain')
        
        # Extract themes from query
        query_tags = extract_themes_gpt(user_query, openai)
        
        # Get semantic chunks
        matches = get_semantic_chunks(user_query, books_index, EMBEDDING_MODEL, openai, top_k=10)
        boosted = boost_by_tag(matches, query_tags)
        
        # Build context
        context, used_ids, sources = build_context(boosted[:3])
        
        # Generate answer
        system_prompt = (
            "You are a spiritual and mental health assistant grounded in Islamic tradition. The following CONTEXT is drawn from classical Tazkiyah texts and is provided to help you answer the user's question. The user did NOT write the context. If you don't know how to answer the question, say so and do NOT hallucinate."
        )
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {user_query}"}
        ]
        def generate_spiritual():
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=800,
                temperature=0.3,
                stream=True
            )
            for chunk in response:
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    yield delta.content
            if sources:
                def slug_to_title(slug):
                    return ' '.join(word.capitalize() for word in slug.replace('-', ' ').split())
                formatted_sources = [slug_to_title(src) for src in sources]
                yield f"\n\n**Sources:**\n" + "\n".join(f"- {src}" for src in formatted_sources)
        return Response(stream_with_context(generate_spiritual()), mimetype='text/plain')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/api/search', methods=['POST'])
def search_hadiths():
    try:
        data = request.get_json()
        search_query = data.get('query', '')
        
        if not search_query:
            return jsonify({'error': 'No search query provided'}), 400
        
        # Get semantic chunks for the search query
        matches = get_semantic_chunks(search_query, hadiths_index, EMBEDDING_MODEL, openai, top_k=15)
        
        hadith_matches = []
        for match in matches:
            metadata = match.get('metadata', {})
            if not metadata.get('text_en', '').strip():
                continue  # Skip if text_en is empty
            hadith_matches.append({
                'id': match['id'],
                'score': match['score'],
                'text': metadata.get('text', ''),
                'text_ar': metadata.get('text_ar', ''),
                'text_en': metadata.get('text_en', ''),
                'chapter': metadata.get('chapter', ''),
                'source': metadata.get('source', ''),
                'book_id': metadata.get('book_id', ''),
                'page': metadata.get('page', ''),
                'tags': metadata.get('tags', [])
            })
        hadith_matches.sort(key=lambda x: x['score'], reverse=True)
        results = hadith_matches[:10]
        return jsonify({
            'query': search_query,
            'results': results,
            'total_found': len(hadith_matches)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/hadith/<hadith_id>', methods=['GET'])
def get_hadith_by_id(hadith_id):
    try:
        pinecone_id = str(hadith_id)
        response = hadiths_index.fetch(ids=[pinecone_id])
        # Handle both object and dict response
        if hasattr(response, 'vectors'):
            vectors = response.vectors
        else:
            vectors = response['vectors']

        if not vectors or pinecone_id not in vectors:
            return jsonify({'error': 'Hadith not found'}), 404

        hadith_data = vectors[pinecone_id]
        metadata = hadith_data.metadata if hasattr(hadith_data, 'metadata') else hadith_data['metadata']
        hadith = {
            'id': pinecone_id,
            'score': 1.0,
            'chain_indx': metadata.get('chain_indx', ''),
            'chapter': metadata.get('chapter', ''),
            'chapter_no': metadata.get('chapter_no', ''),
            'hadith_no': metadata.get('hadith_no', ''),
            'source': metadata.get('source', ''),
            'text_ar': metadata.get('text_ar', ''),
            'text_en': ai_refine_text(metadata.get('text_en', ''), openai),
            'text': metadata.get('text', '')
        }
        return jsonify(hadith)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
