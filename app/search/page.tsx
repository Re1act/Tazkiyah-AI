'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface HadithResult {
  id: string;
  score: number;
  text: string;
  book_id: string;
  page: string;
  tags: string[];
  text_ar?: string;
  text_en?: string;
}

interface SearchResponse {
  query: string;
  results: HadithResult[];
  total_found: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HadithResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus on search input when page loads
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('https://tazkiyah-ai.onrender.com/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResults(data.results);
      setTotalFound(data.total_found);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalFound(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatScore = (score: number) => {
    return Math.round(score * 100);
  };

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Hadith Search</h2>
        <p className="text-gray-600">Search through authentic hadiths for spiritual guidance and wisdom</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search for hadiths about patience, gratitude, prayer, or any topic..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Searching through hadiths...</p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Search Results
                  </h3>
                  <span className="text-sm text-gray-600">
                    {totalFound} hadith{totalFound !== 1 ? 's' : ''} found
                  </span>
                </div>
              </div>

              {/* Results List */}
              <div className="divide-y divide-gray-200">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">No hadiths found</h4>
                    <p className="text-gray-600">Try adjusting your search terms or try a different topic.</p>
                  </div>
                ) : (
                  searchResults.map((hadith, index) => (
                    <Link 
                      key={hadith.id} 
                      href={`/search/${hadith.id}`}
                      className="block p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Relevance Score */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-bold text-sm">
                              {formatScore(hadith.score)}%
                            </span>
                          </div>
                        </div>

                        {/* Hadith Content */}
                        <div className="flex-1 min-w-0">
                          <div className="prose prose-sm max-w-none">
                            {hadith.text_ar && (
                              <p className="text-right font-arabic text-gray-900 mb-1">{truncateText(hadith.text_ar, 120)}</p>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {hadith.book_id && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>{hadith.book_id}</span>
                              </span>
                            )}
                            {hadith.page && (
                              <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Page {hadith.page}</span>
                              </span>
                            )}
                          </div>

                          {/* Click indicator */}
                          <div className="mt-3 flex items-center text-green-600 text-sm">
                            <span>Click to read full hadith</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasSearched && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search Tips</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Example Topics:</h4>
              <div className="flex flex-wrap gap-2">
                {['patience', 'gratitude', 'prayer', 'charity', 'forgiveness', 'hope'].map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSearchQuery(topic);
                      setTimeout(() => handleSearch(), 100);
                    }}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Search Examples:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• "Concentration in prayer"</li>
                <li>• "Benefits of patience"</li>
                <li>• "Importance of prayer"</li>
                <li>• "Being grateful to Allah"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
