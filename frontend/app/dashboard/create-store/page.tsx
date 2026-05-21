'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';  // Changed this
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Store, Globe, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateStorePage() {
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Remove this line: const supabase = createClientComponentClient();
  const router = useRouter();

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    setSlug(generateSlug(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error } = await supabase.from('stores').insert([
        {
          user_id: user.id,
          name: storeName,
          slug: slug,
          description: description,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      toast.success('Store created! Waiting for admin approval.');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Create Your Store</h1>
            <p className="text-gray-600 mt-2">
              Fill out the details below to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => handleStoreNameChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="My Awesome Store"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store URL (slug)
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">FroppShop.com/store/</span>
                <span className="font-mono text-purple-600">{slug || 'your-store'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This will be your unique store link
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell customers what you sell..."
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-800 font-medium">
                    Your store needs admin approval
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Once approved, You will be able to add products and start selling.
                    This usually takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !storeName}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Store'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}