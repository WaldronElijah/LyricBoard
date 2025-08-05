    // Create this file: app/providers.tsx
    // Make sure this file is in the root of your 'app' directory, or adjust the import path in layout.tsx.

    "use client"; // This directive is crucial for providers that use context

    import { SessionProvider } from "next-auth/react";
    import React from "react";

    interface ProvidersProps {
      children: React.ReactNode;
    }

    export default function Providers({ children }: ProvidersProps) {
      // This component wraps its children with the SessionProvider,
      // making session data available to any client components down the tree.
      return <SessionProvider>{children}</SessionProvider>;
    }
    