import Link from 'next/link';

interface HadithDetail {
  id: string;
  score: number;
  text: string;
  text_ar?: string;
  text_en?: string;
  chapter?: string;
  source?: string;
  chain_indx?: string;
  chapter_no?: string;
  hadith_no?: string;
}

async function getHadith(id: string): Promise<HadithDetail | null> {
  try {
    const res = await fetch(`http://localhost:5000/api/hadith/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function HadithPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hadith = await getHadith(id);

  if (!hadith) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Hadith Not Found</h2>
            <p className="text-gray-600 mb-6">Sorry, this hadith could not be found.</p>
            <Link 
              href="/search"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/search"
          className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Search</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Hadith Details</h1>
      </div>

      {/* Hadith Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Hadith Text Section */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Hadith Text</h2>
        </div>

        {/* Full Hadith Text: Arabic & English */}
        <div className="p-6">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row md:space-x-8">
              {hadith.text_ar && (
                <div className="md:w-1/2 mb-4 md:mb-0">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">Arabic</h3>
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-lg text-right font-arabic">
                    {hadith.text_ar}
                  </p>
                </div>
              )}
              {hadith.text_en && (
                <div className="md:w-1/2">
                  <h3 className="text-md font-semibold text-gray-700 mb-2">English</h3>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                    {hadith.text_en}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chapter and Source Info */}
          <div className="mb-6 flex flex-col md:flex-row md:space-x-8">
            {hadith.chapter && (
              <div className="mb-2 md:mb-0">
                <span className="font-semibold text-gray-700">Chapter: </span>
                <span className="text-gray-800">{hadith.chapter}</span>
              </div>
            )}
            {hadith.source && (
              <div>
                <span className="font-semibold text-gray-700">Source: </span>
                <span className="text-gray-800">{hadith.source}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Additional Information
              </h3>
              <div className="space-y-3">
                {hadith.chain_indx && (
                  <div>
                    <span className="font-semibold text-gray-700">Chain Index: </span>
                    <span className="text-gray-800">{hadith.chain_indx}</span>
                  </div>
                )}
                {hadith.chapter_no && (
                  <div>
                    <span className="font-semibold text-gray-700">Chapter No: </span>
                    <span className="text-gray-800">{hadith.chapter_no}</span>
                  </div>
                )}
                {hadith.hadith_no && (
                  <div>
                    <span className="font-semibold text-gray-700">Hadith No: </span>
                    <span className="text-gray-800">{hadith.hadith_no}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Note</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                This hadith has been retrieved from our database of authentic Islamic texts. 
                For more detailed analysis or to explore related hadiths, please use the search function.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-4">
        <Link 
          href="/search"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Search More Hadiths
        </Link>
        <Link 
          href="/"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Back to Chat
        </Link>
      </div>
    </div>
  );
} 