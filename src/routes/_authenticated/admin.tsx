import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adjustBalance, checkAdminAccess, deleteAdminAccounts, getAdminAccounts, updateAdminAccountEmail } from "@/lib/account.functions";
import { AdminShell } from "@/components/aurum/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pageHead } from "@/components/aurum/page";

export const Route=createFileRoute("/_authenticated/admin")({beforeLoad:async()=>{try{await checkAdminAccess();}catch{throw redirect({to:"/admin-login"});}},head:()=>pageHead("Administration","Authorized Supergrow account administration."),component:Admin});
function Admin(){
  const get=useServerFn(getAdminAccounts),adjust=useServerFn(adjustBalance),remove=useServerFn(deleteAdminAccounts),updateEmail=useServerFn(updateAdminAccountEmail),queryClient=useQueryClient();
  const {data,error,isLoading}=useQuery({queryKey:["admin-accounts"],queryFn:()=>get(),retry:false});
  const [selected,setSelected]=useState<Set<string>>(new Set()); const [active,setActive]=useState(""); const [amount,setAmount]=useState(""); const [note,setNote]=useState(""); const [email,setEmail]=useState(""); const [message,setMessage]=useState("");
  function toggle(id:string){setSelected((current)=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});}
  async function refresh(){await queryClient.invalidateQueries({queryKey:["admin-accounts"]});}
  async function post(event:React.FormEvent){event.preventDefault();setMessage("");try{await adjust({data:{userId:active,amount:Number(amount),note:note||undefined}});setAmount("");setMessage("Ledger adjustment posted.");await refresh();}catch(e){setMessage(e instanceof Error?e.message:"Adjustment failed");}}
  async function saveEmail(event:React.FormEvent){event.preventDefault();setMessage("");try{await updateEmail({data:{userId:active,email}});setMessage("Email updated.");await refresh();}catch(e){setMessage(e instanceof Error?e.message:"Email update failed");}}
  async function deleteSelected(){if(!selected.size||!window.confirm(`Delete ${selected.size} selected account${selected.size===1?"":"s"}? This cannot be undone.`))return;setMessage("");try{await remove({data:{userIds:[...selected]}});setSelected(new Set());setActive("");setMessage("Selected accounts deleted.");await refresh();}catch(e){setMessage(e instanceof Error?e.message:"Deletion failed");}}
  return <AdminShell><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Restricted operations</p><h1 className="mt-2 font-display text-3xl font-semibold">Account administration</h1></div>{selected.size>0&&<Button variant="destructive" onClick={deleteSelected}>Delete selected ({selected.size})</Button>}</div>
    {error?<div className="mt-7 border border-destructive/40 bg-destructive/5 p-6"><h2 className="font-semibold">Administrator access required</h2><p className="mt-2 text-sm text-muted-foreground">This area requires an administrator role verified by the server. Passwords remain encrypted and unavailable to staff.</p></div>:<><div className="mt-7 overflow-auto border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="p-4"><span className="sr-only">Select</span></th><th>Account</th><th>Created</th><th>Status</th><th>Balance</th><th></th></tr></thead><tbody>{isLoading?<tr><td className="p-6" colSpan={6}>Loading accounts…</td></tr>:data?.map((user)=><tr key={user.id} className="border-t border-border"><td className="p-4"><input type="checkbox" checked={selected.has(user.id)} onChange={()=>toggle(user.id)} aria-label={`Select ${user.email}`}/></td><td>{user.email}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td className="capitalize">{user.status}</td><td className="font-mono">${user.balance.toLocaleString()}</td><td><Button size="sm" variant="outline" onClick={()=>{setActive(user.id);setEmail(user.email);}}>Manage</Button></td></tr>)}</tbody></table></div>
      {active&&<div className="mt-5 grid max-w-4xl gap-5 md:grid-cols-2"><form onSubmit={post} className="space-y-3 border border-border bg-card/40 p-5"><h2 className="font-semibold">Update balance</h2><Input type="number" step="0.01" required placeholder="Amount, negative for debit" value={amount} onChange={(event)=>setAmount(event.target.value)}/><Button>Update balance</Button></form></div>}{message&&<p role="status" className="mt-4 text-sm text-primary">{message}</p>}</>}
  </AdminShell>;
}