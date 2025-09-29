import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Zap, Rocket, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Distill Webhook Visualizer
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Receive, store, and visualize data from Distill Web Monitor webhooks in real-time
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" asChild>
            <Link to="/dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              View Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/deploy" className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Deploy & Manage
            </Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <CardTitle>Real-time Webhooks</CardTitle>
            </div>
            <CardDescription>
              Receive and process Distill webhook data in real-time with automatic timestamp parsing
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <CardTitle>Interactive Charts</CardTitle>
            </div>
            <CardDescription>
              Generate beautiful, interactive time-series charts with change detection and comparisons
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <CardTitle>Easy Deployment</CardTitle>
            </div>
            <CardDescription>
              Deploy with Docker or locally with simple commands. Includes management interface
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup</CardTitle>
          <CardDescription>
            Get started with Distill webhooks in two simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">1. Configure Distill Webhook</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Set your webhook URL in Distill to:
              </p>
              <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                <code className="text-sm">http://localhost:8000/webhook/distill</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText('http://localhost:8000/webhook/distill');
                    alert('Webhook地址已复制到剪贴板！');
                  }}
                >
                  复制
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Start Monitoring</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Choose JSON format for webhook payload and start monitoring your websites.
              </p>
              <Button asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;