// app/admin/page.tsx
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Code, Trash2, Loader2, PlusCircle, LogOut, Home, Wallet, Download, DollarSign, Landmark } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Project {
    _id: string;
    name: string;
    url: string;
}

interface AdminGift {
    _id: string;
    from: string;
    amount: number;
    message: string;
    timestamp: string;
    status: 'completed' | 'withdrawn';
}

interface PlatformFee {
    _id: string;
    amount: number;
    status: 'collected' | 'withdrawn';
    timestamp: string;
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
const PAYSTACK_TRANSFER_FEE_KES = 20;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developerGifts, setDeveloperGifts] = useState<AdminGift[]>([]);
  const [platformFees, setPlatformFees] = useState<PlatformFee[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isWithdrawingGifts, setIsWithdrawingGifts] = useState(false);
  const [giftMpesaNumber, setGiftMpesaNumber] = useState('');
  const [giftStatusMessage, setGiftStatusMessage] = useState('');

  const [isWithdrawingFees, setIsWithdrawingFees] = useState(false);
  const [feeMpesaNumber, setFeeMpesaNumber] = useState('');
  const [feeStatusMessage, setFeeStatusMessage] = useState('');

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
          if (feesData.success) setPlatformFees(feesData.fees);

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
  
  const availableGiftBalance = developerGifts.filter(g => g.status === 'completed').reduce((sum, g) => sum + g.amount, 0);
  const finalGiftPayout = availableGiftBalance > 0 ? availableGiftBalance - PAYSTACK_TRANSFER_FEE_KES : 0;

  const availableFeeBalance = platformFees.filter(f => f.status === 'collected').reduce((sum, f) => sum + f.amount, 0);
  const finalFeePayout = availableFeeBalance > 0 ? availableFeeBalance - PAYSTACK_TRANSFER_FEE_KES : 0;

  const handleWithdrawGifts = async () => {
      if(finalGiftPayout <= 0 || !giftMpesaNumber) return;
      setIsWithdrawingGifts(true);
      setGiftStatusMessage('Processing withdrawal...');

      const giftIdsToWithdraw = developerGifts.filter(g => g.status === 'completed').map(g => g._id);

      try {
        const res = await fetch('/api/admin/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser.email },
            body: JSON.stringify({ amount: finalGiftPayout, mpesaNumber: giftMpesaNumber, reason: 'Developer support withdrawal', giftIds: giftIdsToWithdraw }),
        });
        const data = await res.json();
        if(data.success) {
            setGiftStatusMessage('✅ Withdrawal successful!');
            setDeveloperGifts(developerGifts.map(g => giftIdsToWithdraw.includes(g._id) ? {...g, status: 'withdrawn'} : g));
        } else { throw new Error(data.message); }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'An error occurred.';
        setGiftStatusMessage(`❌ ${msg}`);
      } finally {
          setIsWithdrawingGifts(false);
          setTimeout(() => setGiftStatusMessage(''), 5000);
      }
  }
  
  const handleWithdrawFees = async () => {
      if(finalFeePayout <= 0 || !feeMpesaNumber) return;
      setIsWithdrawingFees(true);
      setFeeStatusMessage('Processing withdrawal...');

      const feeIdsToWithdraw = platformFees.filter(f => f.status === 'collected').map(f => f._id);

      try {
        const res = await fetch('/api/admin/withdraw-fees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': currentUser.email },
            body: JSON.stringify({ amount: finalFeePayout, mpesaNumber: feeMpesaNumber, reason: 'Platform fee withdrawal', feeIds: feeIdsToWithdraw }),
        });
        const data = await res.json();
        if(data.success) {
            setFeeStatusMessage('✅ Withdrawal successful!');
            setPlatformFees(platformFees.map(f => feeIdsToWithdraw.includes(f._id) ? {...f, status: 'withdrawn'} : f));
        } else { throw new Error(data.message); }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'An error occurred.';
        setFeeStatusMessage(`❌ ${msg}`);
      } finally {
          setIsWithdrawingFees(false);
          setTimeout(() => setFeeStatusMessage(''), 5000);
      }
  }

  const handleLogout = async () => { /* as before */ };

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

      <main className="container mx-auto p-4 md:p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            {/* Project Management Card - simplified for brevity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Code className="mr-2"/>Manage Projects</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Project form and list would go here */}
                    <p>Project management UI placeholder.</p>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Gift className="mr-2"/>Gifts for You</CardTitle>
                        <CardDescription>{developerGifts.length} gifts received.</CardDescription>
                    </CardHeader>
                    <CardContent className='max-h-72 overflow-y-auto'>
                    {developerGifts.length > 0 ? developerGifts.map(g => (
                        <div key={g._id} className="p-2 border-b">
                        <p><b>{g.from}</b> sent <b>KES {g.amount}</b> (<Badge variant={g.status === 'completed' ? 'default' : 'secondary'}>{g.status}</Badge>)</p>
                        <p className='text-sm text-gray-600'>"{g.message}"</p>
                        </div>
                    )) : <p>No gifts received yet.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Landmark className="mr-2"/>Platform Fees</CardTitle>
                        <CardDescription>{platformFees.length} fees collected.</CardDescription>
                    </CardHeader>
                    <CardContent className='max-h-72 overflow-y-auto'>
                    {platformFees.length > 0 ? platformFees.map(f => (
                        <div key={f._id} className="p-2 border-b flex justify-between items-center">
                          <p>Fee of <b>KES {f.amount}</b></p>
                          <Badge variant={f.status === 'collected' ? 'default' : 'secondary'}>{f.status}</Badge>
                        </div>
                    )) : <p>No fees collected yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Wallet className="mr-2"/>Withdraw Gifts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Available Balance</p>
                            <p className="text-2xl font-bold">KES {availableGiftBalance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                            <div className="flex justify-between"><span>Transfer Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES}</span></div>
                            <hr/>
                            <div className="flex justify-between font-bold"><span>Final Payout:</span><span>KES {finalGiftPayout > 0 ? finalGiftPayout.toFixed(2) : '0.00'}</span></div>
                        </div>
                        <div>
                            <Label htmlFor="giftMpesa">M-Pesa Number</Label>
                            <Input id="giftMpesa" value={giftMpesaNumber} onChange={e => setGiftMpesaNumber(e.target.value)} placeholder="07..."/>
                        </div>
                        <Button onClick={handleWithdrawGifts} disabled={isWithdrawingGifts || finalGiftPayout <= 0} className="w-full">
                            {isWithdrawingGifts ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : <><Download className="mr-2 h-4 w-4"/> Withdraw Gifts</>}
                        </Button>
                        {giftStatusMessage && <p className="text-center text-sm">{giftStatusMessage}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><DollarSign className="mr-2"/>Withdraw Fees</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Available Balance</p>
                            <p className="text-2xl font-bold">KES {availableFeeBalance.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-md text-sm space-y-1">
                             <div className="flex justify-between"><span>Transfer Fee:</span><span>- KES {PAYSTACK_TRANSFER_FEE_KES}</span></div>
                            <hr/>
                            <div className="flex justify-between font-bold"><span>Final Payout:</span><span>KES {finalFeePayout > 0 ? finalFeePayout.toFixed(2) : '0.00'}</span></div>
                        </div>
                        <div>
                            <Label htmlFor="feeMpesa">M-Pesa Number</Label>
                            <Input id="feeMpesa" value={feeMpesaNumber} onChange={e => setFeeMpesaNumber(e.target.value)} placeholder="07..."/>
                        </div>
                        <Button onClick={handleWithdrawFees} disabled={isWithdrawingFees || finalFeePayout <= 0} className="w-full">
                            {isWithdrawingFees ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Processing...</> : <><Download className="mr-2 h-4 w-4"/> Withdraw Fees</>}
                        </Button>
                        {feeStatusMessage && <p className="text-center text-sm">{feeStatusMessage}</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
