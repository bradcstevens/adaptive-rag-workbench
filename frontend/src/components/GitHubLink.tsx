import { useState, useEffect } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function GitHubLink() {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/thegovind/adaptive-rag-workbench');
        const data = await response.json();
        setStarCount(data.stargazers_count);
      } catch (error) {
        console.error('Failed to fetch GitHub star count:', error);
        setStarCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStarCount();
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-200"
      onClick={() => window.open('https://github.com/thegovind/adaptive-rag-workbench', '_blank')}
    >
      <Star className="h-4 w-4" />
      <span className="text-sm font-medium">Star</span>
      {loading ? (
        <div className="w-6 h-4 bg-gray-200 animate-pulse rounded" />
      ) : (
        <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-700">
          {starCount?.toLocaleString() || '0'}
        </Badge>
      )}
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
}
