"use client";

import { useState, useRef } from "react";
import {
  KnockProvider,
  KnockFeedProvider,
  NotificationIconButton,
  NotificationFeedPopover,
} from "@knocklabs/react";
import "@knocklabs/react/dist/index.css";
import { useAuth } from "@/context/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const notifButtonRef = useRef(null);

  // Use environment variables for Knock configuration
  const knockApiKey = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY;
  const knockFeedId = process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID;

  // If user is not loaded yet, or missing keys, just return nothing
  if (!user || !user.id || !knockApiKey || !knockFeedId) return null;

  return (
    <KnockProvider apiKey={knockApiKey} userId={user.id}>
      <KnockFeedProvider feedId={knockFeedId}>
        <div className="relative flex items-center">
          <NotificationIconButton
            ref={notifButtonRef}
            onClick={(e) => setIsVisible(!isVisible)}
          />
          <NotificationFeedPopover
            buttonRef={notifButtonRef}
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
          />
        </div>
      </KnockFeedProvider>
    </KnockProvider>
  );
}
