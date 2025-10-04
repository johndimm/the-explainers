'use client'

import React from 'react'
import { PlayIconPreview } from '@/components/PlayIcon'

export default function IconPreviewPage() {
  const plays = [
    {
      title: "Romeo and Juliet",
      text: "R&J",
      theme: "tragedy" as const,
      description: "Tragedy - Deep purple with crown and sword"
    },
    {
      title: "A Midsummer Night's Dream",
      text: "MSND",
      theme: "comedy" as const,
      description: "Comedy - Emerald green with mask and smile"
    },
    {
      title: "Henry V",
      text: "H5",
      theme: "history" as const,
      description: "History - Deep red with scroll and seal"
    },
    {
      title: "The Tempest",
      text: "TEMP",
      theme: "romance" as const,
      description: "Romance - Violet with heart and stars"
    }
  ]

  const sizes = [64, 128, 256, 512]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Play Icon Preview
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plays.map((play, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {play.title}
              </h3>
              <div className="flex justify-center mb-4">
                <PlayIconPreview
                  playTitle={play.title}
                  appIconText={play.text}
                  themeType={play.theme}
                  size={128}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {play.description}
              </p>
              <div className="text-xs text-gray-500">
                Theme: {play.theme.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Different Sizes
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {sizes.map((size, index) => (
              <div key={index} className="text-center">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  {size}×{size}px
                </h3>
                <div className="flex justify-center mb-2">
                  <PlayIconPreview
                    playTitle="Romeo and Juliet"
                    appIconText="R&J"
                    themeType="tragedy"
                    size={size}
                  />
                </div>
                <div className="text-sm text-gray-500">
                  {size < 128 ? 'Favicon' : size < 256 ? 'App Icon' : 'Large Icon'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            App Store Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Individual Play Apps
              </h3>
              <div className="space-y-4">
                {plays.map((play, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <PlayIconPreview
                      playTitle={play.title}
                      appIconText={play.text}
                      themeType={play.theme}
                      size={64}
                    />
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        {play.title} Explained
                      </div>
                      <div className="text-sm text-gray-600">
                        $4.99 • Shakespeare
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Collection Strategy
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-purple-800 mb-2">
                    Shakespeare Tragedies Collection
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <PlayIconPreview playTitle="Romeo and Juliet" appIconText="R&J" themeType="tragedy" size={48} />
                    <PlayIconPreview playTitle="Hamlet" appIconText="HAM" themeType="tragedy" size={48} />
                    <PlayIconPreview playTitle="Macbeth" appIconText="MAC" themeType="tragedy" size={48} />
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-800 mb-2">
                    Shakespeare Comedies Collection
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <PlayIconPreview playTitle="A Midsummer Night's Dream" appIconText="MSND" themeType="comedy" size={48} />
                    <PlayIconPreview playTitle="Much Ado About Nothing" appIconText="MUCH" themeType="comedy" size={48} />
                    <PlayIconPreview playTitle="Twelfth Night" appIconText="12TH" themeType="comedy" size={48} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Revenue Potential
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">37</div>
              <div className="text-lg font-semibold text-blue-800 mb-2">Shakespeare Plays</div>
              <div className="text-sm text-blue-600">Complete collection potential</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">$5</div>
              <div className="text-lg font-semibold text-green-800 mb-2">Per Play App</div>
              <div className="text-sm text-green-600">Premium pricing strategy</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">$185K</div>
              <div className="text-lg font-semibold text-purple-800 mb-2">Total Potential</div>
              <div className="text-sm text-purple-600">37 plays × $5K each</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}