import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

/**
 * Global provider component that manages visual themes (Light/Dark/System).
 * Wraps the application root to inject theme context and DOM attributes.
 *
 * Side Effects:
 * - Mutates the `<html>` element's class list and `data-theme` attributes on client mount/toggle.
 */
export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
