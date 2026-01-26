"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CollaborationPage() {
    const router = useRouter()
    
    useEffect(() => {
        router.push("/dashboard/collaboration/groups")
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
                <p className="mt-4 text-slate-600">Redirecting...</p>
            </div>
        </div>
    )
}
