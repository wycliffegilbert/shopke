// CSS module declarations
declare module '*.css' {
  const styles: { [className: string]: string };
  export default styles;
}

// Allow importing CSS files as side effects (e.g. import './globals.css')
declare module '*.css' {}

// Environment variable types
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_SITE_URL: string;
    NEXT_PUBLIC_SITE_NAME: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
    NEXT_PUBLIC_PAYPAL_CLIENT_ID?: string;
  }
}
