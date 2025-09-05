'use client';

/**
 * Create Poll Page Component
 * 
 * This client component renders the page for creating new polls.
 * It provides a container for the PollCreateForm component which handles
 * the actual poll creation functionality.
 */

import PollCreateForm from "./PollCreateForm";

export default function CreatePollPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Create a New Poll</h1>
      <PollCreateForm />
    </main>
  );
}