// app/admin/page.tsx
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, Code, Trash2, Loader2, PlusCircle, LogOut, Home, Wallet, Download, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Event } from '@/lib/models/Event'; // Import Event type

interface Project {
    _id: string;
    name: string;
    url: string;
  }
  
  interface AdminGift {
      _id: string;
      id: string;
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
  const [developerGifts, setDeveloperGifts] = useState<AdminGift[]>([]);
  const [platformFees, setPlatformFees] = useState(0);
  const [allEvents, setAllEvents] = useState<Event[]>([]); // New state for all events
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawingFees, setIsWithdrawingFees] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', url: '' });
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [feeStatusMessage, setFeeStatusMessage] = useState('');
  const [adminGiftWithdrawalAmount, setAdminGiftWithdrawalAmount] = useState<string>("");
  const [platformFeeWithdrawalAmount, setPlatformFeeWithdrawalAmount] = useState<string>("");
  const [isDeletingEvent, setIsDeletingEvent] = useState<string | null>(null); // State for event deletion loading

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

          const [projectsRes, giftsRes, feesRes, eventsRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/admin/gifts', { headers: { 'x-user-email': user.email }}),
            fetch('/api/admin/platform-fees', { headers: { 'x-user-email': user.email }}),
            fetch('/api/events') // Fetch all events
          ]);
          
          const projectsData = await projectsRes.json();
          if (projectsData.success) setProjects(projectsData.projects);

          const giftsData = await giftsRes.json();
          if (giftsData.success && Array.isArray(giftsData.gifts)) {
            const validGifts = giftsData.gifts.filter((g: any) => g && typeof g === 'object' && g._id && g.status);
            setDeveloperGifts(validGifts);
          }

          const feesData = await feesRes.json();
          if (feesData.success) setPlatformFees(feesData.totalPlatformFee);

          const eventsData = await eventsRes.json();
          if (eventsData.success) setAllEvents(eventsData.events);

        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);
  
  const availableDeveloperGiftBalance = developerGifts
    .filter(g => g?.status === 'completed' && typeof g?.amount === 'number')
    .reduce((sum, g) => sum + g.amount, 0);

  const adminGiftCalculatedPayout = Math.max(0, parseFloat(adminGiftWithdrawalAmount || '0') - PAYSTACK_TRANSFER_FEE_KES);
  const platformFeeCalculatedPayout = Math.max(0, parseFloat(platformFeeWithdrawalAmount || '0') - PAYSTACK_TRANSFER_FEE_KES);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-user': JSON.stringify({ username: 'admin' })
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
            headers: { 'x-user': JSON.stringify({ username: 'admin' }) },
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

  const handleHardDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) {
      return;
    }

    setIsDeletingEvent(eventId);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser.email }, // Pass admin email for auth
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message); // Inform about success
        setAllEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error hard deleting event:", error);
      alert("An error occurred while permanently deleting the event.");
    } finally {
      setIsDeletingEvent(null);
    }
  };

  const handleWithdrawal = async () => {
    const amountToWithdraw = parseFloat(adminGiftWithdrawalAmount);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0 || amountToWithdraw > availableDeveloperGiftBalance) {
        setStatusMessage("Please enter a valid amount not exceeding your available balance.");
        return;
    }
    if(!mpesaNumber) {
      setStatusMessage("M-Pesa number is required.");
      return;
    }

    setIsWithdrawing(true);
    setStatusMessage('Processing gift withdrawal...');

    // Send the requested amount. Backend will deduct transfer fee and mark gifts.
    try {
        const res = await fetch('/api/admin/withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUser.email,
            },
            body: JSON.stringify({
                amount: amountToWithdraw,
                mpesaNumber,
                reason: 'Developer support withdrawal',
                // giftIds are now handled by backend based on amount, or all if amount covers all.
                // For simplicity here, we assume backend selects gifts to mark.
            }),
        });
        const data = await res.json();
        if(data.success) {
            setStatusMessage('✅ Gift withdrawal successful!');
            // Re-fetch gifts to update status and balance
            const giftsRes = await fetch('/api/admin/gifts', { headers: { 'x-user-email': currentUser.email }});
            const giftsData = await giftsRes.json();
            if (giftsData.success && Array.isArray(giftsData.gifts)) {
                setDeveloperGifts(giftsData.gifts.filter((g: any) => g && typeof g === 'object' && g._id && g.status));
            }
            setAdminGiftWithdrawalAmount(""); // Clear input
        } else {
            throw new Error(data.message);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'An error occurred.';
        setStatusMessage(`❌ ${msg}`);
      } finally {
          setIsWithdrawing(false);
          setTimeout(() => setStatusMessage(''), 7000);
      }
  }
  
  const handleFeeWithdrawal = async () => {
    const amountToWithdraw = parseFloat(platformFeeWithdrawalAmount);
    if (isNaN(amountToWithdraw) || amountToWithdraw <= 0 || amountToWithdraw > platformFees) {
        setFeeStatusMessage("Please enter a valid amount not exceeding available revenue.");
        return;
    }
    if (!mpesaNumber) {
        setFeeStatusMessage("M-Pesa number is required.");
        return;
    }

    setIsWithdrawingFees(true);
    setFeeStatusMessage('Processing fee withdrawal...');

    // Send the requested amount. Backend will deduct transfer fee.
    try {
        const res = await fetch('/api/admin/platform-withdraw', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-email': currentUser.email,
            },
            body: JSON.stringify({
                amount: amountToWithdraw,
                mpesaNumber,
                reason: 'Platform fee withdrawal',
            }),
        });
        const data = await res.json();
        if (data.success) {
            setFeeStatusMessage('✅ Platform fees withdrawn successfully!');
            // Re-fetch platform fees to update balance
            const feesRes = await fetch('/api/admin/platform-fees', { headers: { 'x-user-email': currentUser.email }});
            const feesData = await feesRes.json();
            if (feesData.success) setPlatformFees(feesData.totalPlatformFee);
            setPlatformFeeWithdrawalAmount(""); // Clear input
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'An error occurred.';
        setFeeStatusMessage(`❌ ${msg}`);
    } finally {
        setIsWithdrawingFees(false);
        setTimeout(() => setFeeStatusMessage(''), 7000);
    }
};

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
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className='flex gap-2'>
            <Link href="/" passHref><Button variant="outline" size="sm" className="text-xs sm:text-sm"><Home className="mr-1 h-4 w-4"/>Home</Button></Link>
            <Button onClick={handleLogout} size="sm" className="text-xs sm:text-sm"><LogOut className="mr-1 h-4 w-4"/>Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="md:col-span-2 space-y-6 md:space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl"><DollarSign className="mr-2"/>Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600">KES {platformFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-500">Total fees earned from completed withdrawals.</p>
                </CardContent>
            </Card>
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl"><Code className="mr-2"/>Manage Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProjectSubmit} className="flex flex-col sm:flex-row items-end gap-2 mb-4">
                <div className='flex-grow w-full'>
                  <Label htmlFor="projectName">Name</Label>
                  <Input id="projectName" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="Project Name" required/>
                </div>
                <div className='flex-grow w-full'>
                  <Label htmlFor="projectUrl">URL</Label>
                  <Input id="projectUrl" value={newProject.url} onChange={e => setNewProject({...newProject, url: e.target.value})} placeholder="https://..." required/>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4"/>}
                </Button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-2 border rounded-md">
                    <a href={p.url} target='_blank' rel='noopener noreferrer' className='hover:underline text-sm sm:text-base'>{p.name}</a>
                    <Button variant="ghost" size="icon" onClick={() => handleProjectDelete(p._id)}>
                      <Trash2 className="h-4 w-4 text-red-500"/>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* New Card for Managing All Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl"><Trash2 className="mr-2"/>Manage All Events</CardTitle>
              <CardDescription>Permanently delete any event from the database.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allEvents.length > 0 ? (
                  allEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex-grow">
                        <p className="font-semibold">{event.name} by {event.creatorName}</p>
                        <p className="text-sm text-gray-500">ID: {event.id} | Status: {event.status}</p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleHardDeleteEvent(event.id)}
                        disabled={isDeletingEvent === event.id}
                      >
                        {isDeletingEvent === event.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p>No events found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:space-y-8">
            <Card>
                <CardHeader><CardTitle className="text-lg sm:text-xl">Withdrawal Details</CardTitle></CardHeader>
                <CardContent>
                    <Label htmlFor="mpesaNumber">Your M-Pesa Number (For All Withdrawals)</Label>
                    <Input id="mpesaNumber" value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)} placeholder="07... or 01..." required/>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl"><Wallet className="mr-2"/>Withdraw Platform Fees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Available Revenue</p>
                            <p className="text-xl sm:text-2xl font-bold">KES {platformFees.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="platformFeeWithdrawalAmount">Amount to Withdraw</Label>
                            <Input 
                                id="platformFeeWithdrawalAmount" 
                                type="number" 
                                value={platformFeeWithdrawalAmount}
                                onChange={e => setPlatformFeeWithdrawalAmount(e.target.value)}
                                placeholder={`Max: ${platformFees.toLocaleString()}`}
                                max={platformFees}
                            />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                            <div className="flex justify-between"><span>Paystack Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES.toFixed(2)}</span></div>
                            <hr/>
                            <div className="flex justify-between font-bold text-base sm:text-lg"><span>Final Payout:</span><span>KES {platformFeeCalculatedPayout.toFixed(2)}</span></div>
                        </div>
                        <Button onClick={handleFeeWithdrawal} disabled={isWithdrawingFees || parseFloat(platformFeeWithdrawalAmount || '0') <= 0 || parseFloat(platformFeeWithdrawalAmount || '0') > platformFees} className="w-full">
                            {isWithdrawingFees ? 'Withdrawing...' : <><Download className="mr-2 h-4 w-4"/> Withdraw Fees</>}
                        </Button>
                        {feeStatusMessage && <p className="text-center text-sm font-semibold mt-2">{feeStatusMessage}</p>}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl"><Gift className="mr-2"/>Gifts for You</CardTitle>
                    <CardDescription>{developerGifts.length} gifts received.</CardDescription>
                </CardHeader>
                <CardContent className='max-h-96 overflow-y-auto'>
                {developerGifts.length > 0 ? developerGifts.map(g => (
                    g && g._id && (
                        <div key={g._id} className="p-2 border-b">
                        <p className="text-sm"><b>{g.from || 'Anonymous'}</b> sent <b>KES {(g.amount || 0).toLocaleString()}</b> (<Badge variant="outline">{(g.status || 'unknown').replace(/_/g, ' ')}</Badge>)</p>
                        <p className='text-xs text-gray-600'>"{g.message || ''}"</p>
                        </div>
                    )
                )) : (
                    <p>No gifts received yet.</p>
                )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl"><Wallet className="mr-2"/>Withdraw Your Gifts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Available Balance</p>
                            <p className="text-xl sm:text-2xl font-bold">KES {availableDeveloperGiftBalance.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminGiftWithdrawalAmount">Amount to Withdraw</Label>
                            <Input 
                                id="adminGiftWithdrawalAmount" 
                                type="number" 
                                value={adminGiftWithdrawalAmount}
                                onChange={e => setAdminGiftWithdrawalAmount(e.target.value)}
                                placeholder={`Max: ${availableDeveloperGiftBalance.toLocaleString()}`}
                                max={availableDeveloperGiftBalance}
                            />
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                            <div className="flex justify-between"><span>Paystack Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES.toFixed(2)}</span></div>
                            <hr/>
                            <div className="flex justify-between font-bold text-base sm:text-lg"><span>Final Payout:</span><span>KES {adminGiftCalculatedPayout.toFixed(2)}</span></div>
                        </div>
                        <Button onClick={handleWithdrawal} disabled={isWithdrawing || parseFloat(adminGiftWithdrawalAmount || '0') <= 0 || parseFloat(adminGiftWithdrawalAmount || '0') > availableDeveloperGiftBalance} className="w-full">
                            {isWithdrawing ? 'Withdrawing...' : <><Download className="mr-2 h-4 w-4"/> Withdraw Gifts</>}
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