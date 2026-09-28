import { createFileRoute } from "@tanstack/react-router"; import { AuthForm } from "@/components/aurum/auth-form"; import { pageHead } from "@/components/aurum/page";
export const Route=createFileRoute("/login")({head:()=>pageHead("Log in","Securely access your Supergrow account."),component:()=> <AuthForm mode="login"/>});
