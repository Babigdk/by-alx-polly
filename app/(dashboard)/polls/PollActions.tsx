"use client";

/**
 * Poll Actions Component
 * 
 * This client component displays a single poll card with actions (view, edit, delete).
 * It handles poll deletion confirmation and provides navigation to poll details and edit pages.
 * Only the poll owner can see and use the edit and delete actions.
 */

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

/**
 * Poll interface defining the structure of poll data
 */
interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
}

/**
 * Props interface for the PollActions component
 */
interface PollActionsProps {
  poll: Poll;
}

/**
 * Poll Actions Component
 * 
 * @param props - Component props containing the poll data
 * @returns React component with poll card and action buttons
 */
export default function PollActions({ poll }: PollActionsProps) {
  const { user } = useAuth();
  /**
   * Handles poll deletion with confirmation
   * Prompts user for confirmation before deleting the poll
   * and refreshes the page after successful deletion
   */
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      window.location.reload();
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
