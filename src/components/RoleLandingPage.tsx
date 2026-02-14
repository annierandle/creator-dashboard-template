import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Film, Smartphone, ArrowRight } from 'lucide-react';

export function RoleLandingPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<'creator' | 'va' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputValue.trim();
    if (!id) return;

    if (activeRole === 'creator') {
      navigate(`/?role=creator&id=${encodeURIComponent(id)}`);
    } else if (activeRole === 'va') {
      navigate(`/?role=va&id=${encodeURIComponent(id)}`);
    }
  };

  const handleCardClick = (role: 'creator' | 'va') => {
    setActiveRole(role);
    setInputValue('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Creator Operations Hub
          </h1>
          <p className="text-muted-foreground">
            Professional TikTok Shop Team Management
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Creator Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              activeRole === 'creator'
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleCardClick('creator')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Film className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">🎬 I'm a Creator</CardTitle>
              <CardDescription>Create and film content</CardDescription>
            </CardHeader>
            <CardContent>
              {activeRole === 'creator' && (
                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <Input
                    placeholder="Enter your Creator ID"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    className="text-center"
                    aria-label="Creator ID"
                  />
                  <Button type="submit" className="w-full gap-2" disabled={!inputValue.trim()}>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* VA Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              activeRole === 'va'
                ? 'ring-2 ring-primary shadow-lg'
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleCardClick('va')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">📱 I'm a VA/Poster</CardTitle>
              <CardDescription>Edit and post content</CardDescription>
            </CardHeader>
            <CardContent>
              {activeRole === 'va' && (
                <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                  <Input
                    placeholder="Enter your VA ID"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    className="text-center"
                    aria-label="VA ID"
                  />
                  <Button type="submit" className="w-full gap-2" disabled={!inputValue.trim()}>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
