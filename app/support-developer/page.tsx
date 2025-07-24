// app/support-developer/page.tsx
"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, Heart, Code, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Project {
  _id: string;
  name: string;
  url: string;
}

const giftPackages = [
    { amount: 100, emoji: "☕", label: "Buy me a Coffee" },
    { amount: 500, emoji: "🍕", label: "Buy me a Pizza" },
    { amount: 1000, emoji: "🚀", label: "Boost the Project" },
];

export default function SupportDeveloperPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = selectedPackage?.amount || parseFloat(customAmount);

    if (!finalAmount || finalAmount <= 0 || !email) {
        setStatusMessage('Please select a gift or enter a valid amount, and provide your email.');
        return;
    }
    
    setIsProcessing(true);
    setStatusMessage('Initializing payment...');

    try {
        const response = await fetch('/api/payments/paystack-initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: finalAmount,
                email,
                eventName: 'Support for Developer',
                currency: 'KES',
                eventId: 'dev-support',
                giftData: {
                    from: name || 'Anonymous Supporter',
                    message,
                },
            }),
        });

        const data = await response.json();
        if (data.success) {
            setStatusMessage('Redirecting to secure payment page...');
            window.location.href = data.data.authorization_url;
        } else {
            throw new Error(data.message || 'Failed to initialize payment.');
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        setStatusMessage(`❌ ${errorMessage}`);
        setIsProcessing(false);
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setCustomAmount('');
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedPackage(null);
      setCustomAmount(e.target.value);
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-600">
            <Gift className="h-6 w-6" />
            <span>CelebrateWith.me</span>
          </Link>
          <Button asChild variant="outline">
            <Link href="/">Back to Events</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heart className="mx-auto h-16 w-16 text-pink-500 mb-4" />
            <h1 className="text-4xl font-bold text-gray-800">Support the Developer</h1>
            <p className="text-lg text-gray-600 mt-2">
              If you enjoy this platform, please consider sending a small gift to support its development and maintenance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <Card>
              <CardHeader>
                <CardTitle>Send a Gift of Support</CardTitle>
                <CardDescription>Choose an amount or enter your own.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiftSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {giftPackages.map(pkg => (
                            <Card key={pkg.amount} onClick={() => handleSelectPackage(pkg)} className={`cursor-pointer text-center p-4 transition-all ${selectedPackage?.amount === pkg.amount ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}>
                                <div className="text-3xl">{pkg.emoji}</div>
                                <p className="font-semibold">KES {pkg.amount}</p>
                                <p className="text-xs text-gray-500">{pkg.label}</p>
                            </Card>
                        ))}
                    </div>
                  <div>
                    <Label htmlFor="customAmount">Or Enter a Custom Amount (KES)</Label>
                    <Input id="customAmount" type="number" value={customAmount} onChange={handleCustomAmountChange} placeholder="e.g., 250" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Your Details</h3>
                    <div>
                        <Label htmlFor="name">Your Name (Optional)</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anonymous Supporter" />
                    </div>
                    <div>
                        <Label htmlFor="email">Your Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="for your receipt" required />
                    </div>
                    <div>
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any words of encouragement?" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Please wait</> : <><Gift className="mr-2 h-4 w-4"/> Gift KES {selectedPackage?.amount || customAmount || '0'}</>}
                  </Button>
                  {statusMessage && <p className="text-sm text-center font-semibold pt-2">{statusMessage}</p>}
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Code className="mr-3"/> My Other Projects</h2>
              {isLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin"/>
                  <span>Loading projects...</span>
                </div>
              ) : projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map(project => (
                    <Card key={project._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 flex justify-between items-center">
                        <span className="font-semibold">{project.name}</span>
                        <Button asChild variant="secondary" size="sm">
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            Visit <ExternalLink className="ml-2 h-4 w-4"/>
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                    <CardContent className='p-6'>
                        <p className="text-gray-500 text-center">No other projects have been added yet.</p>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
