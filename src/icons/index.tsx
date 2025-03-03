import { SVGProps } from 'react';

export function TeamsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11.5 10.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      <path d="M15.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      <path d="M19 10.5h-2.5V9c0-.3-.2-.5-.5-.5h-2c-.3 0-.5.2-.5.5v1.5H11V9c0-.3-.2-.5-.5-.5h-2c-.3 0-.5.2-.5.5v1.5H5c-.3 0-.5.2-.5.5v8c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5v-8c0-.3-.2-.5-.5-.5z" />
    </svg>
  );
}

export function ZoomIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 8v4l3 3 1.5-1.5-2.5-2.5V8z" />
    </svg>
  );
}

export function MeetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M13 7h-2v5.5l4.5 2.7.75-1.23-3.25-1.97z" />
    </svg>
  );
} 