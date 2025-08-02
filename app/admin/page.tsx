// app/admin/page.tsx
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Code, Trash2, Loader2, PlusCircle, LogOut, Home, Wallet, Download, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// ... (interfaces remain the same)
interface Project {
    _id: string;
    name: string;
    url: string;
  }
  
  interface AdminGift {
      _id: string;
      id: string; // Added id property
      from: string;
      amount: number;
      message: string;
      timestamp: string;
      status: 'completed' | 'withdrawn';
  }

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const PAYSTACK_TRANSFER_FEE_KES = 20;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developerGifts, setDeveloperGifts] = useState<AdminGift[]>([]); // Renamed from gifts to developerGifts for clarity
  const [platformFees, setPlatformFees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', url: '' });
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function fetchAdminData() {
      setIsLoading(true);
      let user = null;
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        
        if (authData.success && authData.user && authData.user.email === ADMIN_EMAIL) {
          user = authData.user;
          setCurrentUser(user);

          const [projectsRes, giftsRes, feesRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/admin/gifts', { headers: { 'x-user-email': user.email }}),
            fetch('/api/admin/platform-fees', { headers: { 'x-user-email': user.email }})
          ]);
          
          const projectsData = await projectsRes.json();
          if (projectsData.success) setProjects(projectsData.projects);

          const giftsData = await giftsRes.json();
          if (giftsData.success) setDeveloperGifts(giftsData.gifts);

          const feesData = await feesRes.json();
          if (feesData.success) setPlatformFees(feesData.totalPlatformFee);

        } else {
          router.push('/auth'); // Redirect if not authenticated or not admin
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        router.push('/auth'); // Redirect on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);
  
  // Calculate availableBalance from developerGifts with status 'completed'
  const availableBalance = developerGifts.filter(g => g.status === 'completed').reduce((sum, g) => sum + g.amount, 0);
  const finalPayout = availableBalance - PAYSTACK_TRANSFER_FEE_KES;


  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user': JSON.stringify({ username: 'admin' }) // Changed for authentication
            },
            body: JSON.stringify(newProject),
        });
        const data = await res.json();
        if(data.success) {
            setProjects([data.project, ...projects]);
            setNewProject({ name: '', url: '' });
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Failed to add project.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleProjectDelete = async (id: string) => {
    try {
        const res = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
            headers: { 'x-user': JSON.stringify({ username: 'admin' }) }, // Changed for authentication
        });
        const data = await res.json();
        if(data.success) {
            setProjects(projects.filter(p => p._id !== id));
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Failed to delete project.');
    }
  }

  const handleWithdrawal = async () => {
      if(finalPayout <= 0 || !mpesaNumber) return;
      setIsWithdrawing(true);
      setStatusMessage('Processing withdrawal...');

      const giftIdsToWithdraw = developerGifts.filter(g => g.status === 'completed').map(g => g._id);

      try {
        const res = await fetch('/api/admin/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUser.email,
            },
            body: JSON.stringify({
                amount: finalPayout,
                mpesaNumber,
                reason: 'Developer support withdrawal',
                giftIds: giftIdsToWithdraw,
            }),
        });
        const data = await res.json();
        if(data.success) {
            setStatusMessage('✅ Withdrawal successful!');
            // Update UI
            setDeveloperGifts(developerGifts.map(g => giftIdsToWithdraw.includes(g._id) ? {...g, status: 'withdrawn'} : g));
        } else {
            throw new Error(data.message);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'An error occurred.';
        setStatusMessage(`❌ ${msg}`);
      } finally {
          setIsWithdrawing(false);
          setTimeout(() => setStatusMessage(''), 5000);
      }
  }

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(null); 
        router.push('/');
      } else {
        alert(data.message || "Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("An error occurred during logout.");
    }
  };

  if (isLoading || !currentUser) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className='flex gap-2'>
            <Link href="/" passHref><Button variant="outline"><Home className="mr-2 h-4 w-4"/>Home</Button></Link>
            <Button onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-green-600">KES {platformFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-500">Total fees earned from completed withdrawals.</p>
                </CardContent>
            </Card>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Code className="mr-2"/>Manage Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProjectSubmit} className="flex items-end gap-2 mb-4">
                <div className='flex-grow'>
                  <Label htmlFor="projectName">Name</Label>
                  <Input id="projectName" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="Project Name" required/>
                </div>
                <div className='flex-grow'>
                  <Label htmlFor="projectUrl">URL</Label>
                  <Input id="projectUrl" value={newProject.url} onChange={e => setNewProject({...newProject, url: e.target.value})} placeholder="https://..." required/>
                </div>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4"/>}
                </Button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-2 border rounded-md">
                    <a href={p.url} target='_blank' rel='noopener noreferrer' className='hover:underline'>{p.name}</a>
                    <Button variant="ghost" size="icon" onClick={() => handleProjectDelete(p._id)}>
                      <Trash2 className="h-4 w-4 text-red-500"/>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Gift className="mr-2"/>Gifts for You</CardTitle>
                    <CardDescription>{developerGifts.length} gifts received.</CardDescription>
                </CardHeader>
                <CardContent className='max-h-96 overflow-y-auto'>
                {developerGifts.length > 0 ? developerGifts.map(g => (
                    <div key={g._id} className="p-2 border-b">
                    <p><b>{g.from}</b> sent <b>KES {g.amount}</b> (<Badge variant="outline">{g.status.replace(/_/g, ' ')}</Badge>)</p>
                    <p className='text-sm text-gray-600'>"{g.message}"</p>
                    </div>
                )) : (
                    <p>No gifts received yet.</p>
                )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Wallet className="mr-2"/>Withdraw Your Gifts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Available Balance</p>
                            <p className="text-2xl font-bold">KES {availableBalance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                            <div className="flex justify-between"><span>Paystack Transfer Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES.toFixed(2)}</span></div>
                            <hr/>
                            <div className="flex justify-between font-bold text-lg"><span>Final Payout:</span><span>KES {finalPayout > 0 ? finalPayout.toFixed(2) : '0.00'}</span></div>
                        </div>
                         <div>
                            <Label htmlFor="mpesaNumber">Your M-Pesa Number</Label>
                            <Input id="mpesaNumber" value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)} placeholder="07... or 01..." required/>
                        </div>
                        <Button onClick={handleWithdrawal} disabled={isWithdrawing || finalPayout <= 0} className="w-full">
                            {isWithdrawing ? 'Withdrawing...' : <><Download className="mr-2 h-4 w-4"/> Withdraw Funds</>}
                        </Button>
                        {statusMessage && <p className="text-center text-sm font-semibold mt-2">{statusMessage}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
