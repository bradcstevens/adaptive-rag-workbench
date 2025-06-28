import React, { useState, useRef } from 'react';
import { ChatLayout } from '../components/ChatLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

import { Upload, FileText, RefreshCw, Database, TrendingUp, Building2 } from 'lucide-react';

interface IndexStats {
  total_documents: number;
  company_breakdown: Record<string, number>;
}

export function AdaptiveKBManagement() {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadStatus(`Success: ${result.message}`);

      fetchIndexStats();
    } catch (error) {
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchIndexStats = async () => {
    try {
      const response = await fetch('/api/index-stats');
      const stats = await response.json();
      setIndexStats(stats);
    } catch (error) {
      console.error('Failed to fetch index stats:', error);
    }
  };

  React.useEffect(() => {
    fetchIndexStats();
  }, []);

  return (
    <ChatLayout>
      <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-microsoft-purple rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-microsoft-gray">Upload New Documents</h3>
                <p className="text-gray-600">Upload new 10-K filings or other financial documents to automatically update the knowledge base.</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-microsoft-purple transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.html,.htm"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>

                <div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-microsoft-purple hover:bg-purple-700 text-white px-8 py-3"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Supports PDF, HTML files • Maximum size: 50MB
                  </p>
                </div>
              </div>
            </div>

            {uploadStatus && (
              <div className={`mt-6 p-4 rounded-lg border ${
                uploadStatus.startsWith('Error')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-green-50 text-green-700 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {uploadStatus.startsWith('Error') ? (
                    <span className="text-red-500">⚠️</span>
                  ) : (
                    <span className="text-green-500">✅</span>
                  )}
                  <span className="font-medium">{uploadStatus}</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-microsoft-blue rounded-full flex items-center justify-center">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-microsoft-gray">Knowledge Base Statistics</h3>
                  <p className="text-gray-600">Real-time insights into your document repository</p>
                </div>
              </div>
              <Button
                onClick={fetchIndexStats}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {indexStats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-microsoft-blue" />
                      <div>
                        <div className="text-3xl font-bold text-microsoft-blue">
                          {indexStats.total_documents?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-blue-700 font-medium">Total Documents</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-microsoft-green" />
                      <div>
                        <div className="text-3xl font-bold text-microsoft-green">
                          {Object.keys(indexStats.company_breakdown || {}).length}
                        </div>
                        <div className="text-sm text-green-700 font-medium">Companies Indexed</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-microsoft-purple" />
                      <div>
                        <div className="text-3xl font-bold text-microsoft-purple">
                          {Math.round((indexStats.total_documents || 0) / Math.max(Object.keys(indexStats.company_breakdown || {}).length, 1))}
                        </div>
                        <div className="text-sm text-purple-700 font-medium">Avg Docs/Company</div>
                      </div>
                    </div>
                  </Card>
                </div>

                {indexStats.company_breakdown && (
                  <Card className="p-6 bg-gray-50 border-gray-200">
                    <h4 className="font-semibold text-microsoft-gray mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Documents by Company
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(indexStats.company_breakdown).map(([company, count]) => (
                        <div key={company} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                          <div className="font-semibold text-microsoft-gray">{company}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                              {String(count)} docs
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <div className="text-gray-500">Loading statistics...</div>
              </div>
            )}
          </Card>

          <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
            <h3 className="text-xl font-semibold text-microsoft-gray mb-6 flex items-center">
              <div className="w-6 h-6 bg-microsoft-orange rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-xs font-bold">?</span>
              </div>
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  step: 1,
                  title: "Upload Document",
                  description: "Upload a new document (PDF or HTML format)",
                  color: "bg-microsoft-blue"
                },
                {
                  step: 2,
                  title: "Content Extraction",
                  description: "Document Intelligence extracts and structures the content",
                  color: "bg-microsoft-green"
                },
                {
                  step: 3,
                  title: "Vectorization",
                  description: "Content is chunked and vectorized for optimal retrieval",
                  color: "bg-microsoft-purple"
                },
                {
                  step: 4,
                  title: "Knowledge Base Update",
                  description: "Knowledge base is updated and ready for queries",
                  color: "bg-microsoft-orange"
                }
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`${item.color} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <div className="font-semibold text-microsoft-gray">{item.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ChatLayout>
  );
}
