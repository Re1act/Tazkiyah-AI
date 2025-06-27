import re
import nltk
from nltk.corpus import words

word_set = set(words.words())

def smart_split(text):
    def split_word(w):
        for i in range(2, len(w)-2):
            left, right = w[:i], w[i:]
            if left in word_set and right in word_set and w not in word_set:
                return left + ' ' + right
        return w
    return ' '.join([split_word(word) for word in text.split()])

def clean_english_text(text):
    if not text:
        return text
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    text = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', text)
    text = re.sub(r'\s+', ' ', text)
    # Custom stuck word fixes
    text = text.replace('wasnarrated', 'was narrated')
    text = text.replace('andseewhether', 'and see whether')
    text = text.replace('thenall', 'then all')
    text = text.replace('hisdeds', 'his deeds')
    # ...add more as you find them
    return text.strip()

def extract_themes_gpt(query, openai, max_tags=3):
    prompt = (
        f"Given the following user question, identify up to {max_tags} key spiritual or emotional themes (e.g., patience, hope, envy, tawakkul, depression, etc). "
        "Return ONLY the themes as a comma-separated list, with NO explanation or extra text.\n\n"
        f"Question: {query}\n\nThemes:"
    )
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=30,
        temperature=0.2
    )
    tags_line = response.choices[0].message.content.strip().splitlines()[0]
    tags = [tag.strip() for tag in tags_line.split(",") if tag.strip() and len(tag.strip().split()) <= 3]
    return tags

def get_semantic_chunks(query, index, embedding_model, openai, top_k=10):
    response = openai.embeddings.create(
        input=query,
        model=embedding_model
    )
    query_embedding = response.data[0].embedding
    search_results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)
    return search_results['matches']

def boost_by_tag(matches, query_tags):
    for match in matches:
        tags = match['metadata'].get('tags', [])
        if any(tag.lower() in [t.lower() for t in query_tags] for tag in tags):
            match['score'] += 0.2
    return sorted(matches, key=lambda x: x['score'], reverse=True)

def build_context(chunks, max_tokens=1500):
    context = ""
    token_count = 0
    used_ids = []
    sources = set()
    for chunk in chunks:
        text = chunk['metadata'].get('text', '')
        book = chunk['metadata'].get('book_id', None)
        if book:
            sources.add(book)
        tokens = len(text) // 4
        if token_count + tokens > max_tokens:
            break
        context += text + "\n---\n"
        token_count += tokens
        used_ids.append(chunk['id'])
    return context, used_ids, list(sources)

def classify_question_spirituality(question, openai):
    prompt = (
        "Classify the following user question as either 'spiritual' (if it relates to Islamic spirituality, wellness, self-improvement, or mental health) or 'general' (if it is just a greeting, chitchat, or not related to spirituality).\n"
        "Reply with ONLY 'spiritual' or 'general' and nothing else.\n"
        f"Question: {question}\n\nLabel:"
    )
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
        temperature=0
    )
    label = response.choices[0].message.content.strip().lower()
    label = re.sub(r'[^a-z]', '', label)  # Remove non-letter characters
    return label == 'spiritual'

def ai_refine_text(text, openai):
    if not text:
        return text
    prompt = (
        "You are given a hadith text. ONLY fix stuck words (words that are joined together without spaces) and missing spaces. Do NOT change, paraphrase, correct, or alter any other wording, grammar, or punctuation. The hadith text is sensitive and must remain exactly as is except for fixing stuck words and spacing. Return only the corrected text.\n\n"
        f"{text}\n\nCorrected:"
    )
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.0
    )
    return response.choices[0].message.content.strip()



