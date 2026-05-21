'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Store, Package, ShoppingCart, DollarSign, Plus } from 'lucide-react';
import Link from 'next/link';

// Define types for better TypeScript support
type User = {
  id: string;
  email?: string;
};

type Store = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
};

type Stats = {
  products: number;
  orders: number;
  revenue: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    products: 0,
    orders: 0,
    revenue: 0,
  });
  
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.push('/login');
        return;
      }
      setUser({ id: authData.user.id, email: authData.user.email || '' });
      await fetchStore(authData.user.id);
    } catch (err) {
      console.error('Error checking user:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchStore = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching store:', error);
        setStore(null);
        return;
      }
      
      setStore(data as Store);
      
      if (data) {
        // Fetch product count
        const { count: productCount, error: productError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', data.id);
        
        if (productError) {
          console.error('Error fetching products:', productError);
        }
        
        // Fetch orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('store_id', data.id);
        
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
        }
        
        const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
        
        setStats({
          products: productCount || 0,
          orders: orders?.length || 0,
          revenue: totalRevenue,
        });
      }
    } catch (err) {
      console.error('Error in fetchStore:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Error logging out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Store className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-800">FroppShop Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!store ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <Store className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Create Your Store
              </h2>
              <p className="text-gray-600 mb-6">
                Start your e-commerce journey today
              </p>
              <Link
                href="/dashboard/create-store"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                <Plus className="w-5 h-5" />
                Create Store
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={`mb-6 p-4 rounded-lg ${
              store.status === 'approved' 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : store.status === 'pending'
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="font-semibold">
                Store Status: {store.status.toUpperCase()}
                {store.status === 'pending' && ' - Waiting for admin approval'}
                {store.status === 'approved' && ' - Your store is live!'}
              </p>
              {store.status === 'approved' && (
                <p className="text-sm mt-1">
                  Share your store: FroppShop.com/store/{store.slug}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-800">{stats.products}</span>
                </div>
                <h3 className="text-gray-600">Total Products</h3>
                <Link href="/dashboard/products" className="text-blue-600 text-sm mt-2 inline-block">
                  Manage Products →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-800">{stats.orders}</span>
                </div>
                <h3 className="text-gray-600">Total Orders</h3>
                <Link href="/dashboard/orders" className="text-green-600 text-sm mt-2 inline-block">
                  View Orders →
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-800">${stats.revenue}</span>
                </div>
                <h3 className="text-gray-600">Total Revenue</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/dashboard/products/add"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
              >
                <Plus className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-gray-800 mb-1">Add New Product</h3>
                <p className="text-gray-600 text-sm">Add products to your store</p>
              </Link>

              <Link
                href="/dashboard/orders"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
              >
                <ShoppingCart className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition" />
                <h3 className="font-semibold text-gray-800 mb-1">View Orders</h3>
                <p className="text-gray-600 text-sm">Manage and fulfill orders</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}