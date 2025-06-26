'use client';

import Link from 'next/link';
import Image from "next/image";

export default function Nav() {
  return (
    <div className="bg-gradient-to-r from-green-800 to-green-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <Image src="/logo.png" alt="Tazkiyah AI Logo" width={60} height={60} className="rounded-full" />
              <div>
                <h1 className="text-2xl font-bold">Tazkiyah AI</h1>
                <p className="text-green-200 text-sm">Your Spiritual Wellness Companion</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/search"
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Hadiths</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
