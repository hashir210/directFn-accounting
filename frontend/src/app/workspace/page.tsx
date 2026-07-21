'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Search, ChevronRight, Shield, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';

type Organization = {
  id: string;
  name: string;
};

type OrgResponse = {
  platform: Organization[];
  customerOrgs: Organization[];
};

export default function WorkspaceSelectorPage() {
  const router = useRouter();
  const [data, setData] = useState<OrgResponse>({ platform: [], customerOrgs: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await apiFetch<OrgResponse>('/api/v1/organizations/public');
        setData(data);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const filteredOrgs = data.customerOrgs.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 flex flex-col gap-6">
        <div className="text-center mb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Welcome to FinFlow</h1>
          <p className="text-muted-foreground mt-2">
            Select your workspace to continue
          </p>
        </div>

        {isLoading ? (
          <Card className="border-muted shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="py-8">
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-16 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {data.platform.length > 0 && (
              <Card className="border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">FinFlow Platform</CardTitle>
                      <CardDescription>Manage platform, organizations, and users</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex flex-col gap-2">
                    {data.platform.map(org => (
                      <button
                        key={org.id}
                        onClick={() => router.push(`/login?orgId=${org.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{org.name}</div>
                            <div className="text-xs text-muted-foreground">Platform administration</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                {data.platform.length > 0 ? 'Or choose your organization' : 'Choose your organization'}
              </span>
              <div className="h-px bg-border flex-1" />
            </div>

            <Card className="border-muted shadow-lg bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search organizations..."
                    className="pl-9 bg-background/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[280px] overflow-y-auto pr-2 pb-6">
                {filteredOrgs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {filteredOrgs.map(org => (
                      <button
                        key={org.id}
                        onClick={() => router.push(`/login?orgId=${org.id}`)}
                        className="flex items-center justify-between p-4 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-xs text-muted-foreground">Select to login</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{searchQuery ? 'No organizations match your search.' : 'No organizations found.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-border flex-1" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">New here?</span>
              <div className="h-px bg-border flex-1" />
            </div>

            <Button size="lg" className="w-full shadow-md group cursor-pointer" onClick={() => router.push('/register')}>
              <Plus className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
              Create New Organization
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
