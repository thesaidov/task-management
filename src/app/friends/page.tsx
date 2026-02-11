"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User } from "@/types";

interface FriendEntry {
  id: string;
  status: string;
  friend: User;
}

interface FriendsData {
  friends: FriendEntry[];
  pendingSent: FriendEntry[];
  pendingReceived: FriendEntry[];
}

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<FriendsData>({
    friends: [],
    pendingSent: [],
    pendingReceived: [],
  });
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchFriends();
  }, [status, router]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to send request");
        return;
      }

      setEmail("");
      await fetchFriends();
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleAction = async (
    friendshipId: string,
    action: "accept" | "reject" | "unfriend",
  ) => {
    try {
      if (action === "unfriend") {
        await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/friends/${friendshipId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "accept" ? "ACCEPTED" : "REJECTED",
          }),
        });
      }
      await fetchFriends();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Friends</h1>
            </div>
            {data.pendingReceived.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {data.pendingReceived.length} new
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Send Request Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add a Friend
          </h2>
          <form onSubmit={handleSendRequest} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sending ? "Sending..." : "Send Request"}
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-lg font-medium text-sm ${
              activeTab === "friends"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Friends ({data.friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 ${
              activeTab === "requests"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Requests
            {data.pendingReceived.length > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === "requests"
                    ? "bg-white text-blue-600"
                    : "bg-red-500 text-white"
                }`}
              >
                {data.pendingReceived.length}
              </span>
            )}
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {data.friends.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-5xl mb-3">👥</p>
                <p className="text-gray-500">
                  No friends yet. Send a request above!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {data.friends.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.friend.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entry.friend.email}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction(entry.id, "unfriend")}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Unfriend
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {/* Incoming Requests */}
            {data.pendingReceived.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-blue-50 border-b">
                  <p className="text-sm font-semibold text-blue-800">
                    Incoming Requests
                  </p>
                </div>
                <div className="divide-y">
                  {data.pendingReceived.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.friend.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.friend.email}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(entry.id, "accept")}
                          className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(entry.id, "reject")}
                          className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {data.pendingSent.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 bg-yellow-50 border-b">
                  <p className="text-sm font-semibold text-yellow-800">
                    Sent Requests
                  </p>
                </div>
                <div className="divide-y">
                  {data.pendingSent.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.friend.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.friend.email}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.pendingReceived.length === 0 &&
              data.pendingSent.length === 0 && (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-5xl mb-3">📬</p>
                  <p className="text-gray-500">No pending requests</p>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
