'use client';

import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Small shared form primitives so every new form (Classes, Teachers,
// Students, Attendance, Classwork, Homework, Announcements) looks and
// behaves the same way instead of re-styling inputs five times over.

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClasses =
  'w-full rounded-sm border border-paper-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-margin disabled:opacity-60';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClasses} ${props.className ?? ''}`} />;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-board text-chalk font-semibold text-sm rounded-sm px-4 py-2 hover:bg-board-deep transition-colors disabled:opacity-60 ${props.className ?? ''}`}
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`text-ink-soft font-medium text-sm rounded-sm px-4 py-2 border border-paper-line hover:border-margin hover:text-margin transition-colors disabled:opacity-60 ${props.className ?? ''}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-[#FFFDF8] border border-paper-line rounded-sm p-5 ${className}`}>{children}</div>;
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-margin">{children}</p>;
}

export function SuccessText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-marigold-deep font-mono">{children}</p>;
}
