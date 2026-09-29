import { useState } from "react";
import { Copy, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ADDRESS = "0xF726f226e00264f89C55Bd9f7CB8FaF9709bc267";

export function AddBalanceButton({ size = "sm" }: { size?: "sm" | "default" }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(ADDRESS); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return <Dialog>
    <DialogTrigger asChild><Button size={size} variant="outline"><Plus className="size-4"/>Add balance</Button></DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>Add balance</DialogTitle><DialogDescription>Send USDT on the Polygon network to the address below.</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <div className="border border-border bg-muted/30 p-3"><p className="text-xs uppercase text-muted-foreground">Network</p><p className="mt-1 text-sm font-semibold">USDT (Polygon Network)</p></div>
        <div className="border border-border bg-muted/30 p-3"><p className="text-xs uppercase text-muted-foreground">Deposit address</p><p className="mt-1 break-all font-mono text-sm">{ADDRESS}</p></div>
        <Button onClick={copy} className="w-full">{copied ? <><Check className="size-4"/>Copied</> : <><Copy className="size-4"/>Copy address</>}</Button>
        <p className="text-xs leading-5 text-muted-foreground">Only send USDT via Polygon. Your balance is updated after the deposit is confirmed.</p>
      </div>
    </DialogContent>
  </Dialog>;
}
