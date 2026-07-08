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
  const knockApiKey = process.env.NEXT_PUBLIC_KNOCK_API_KEY || "pk_placeholder";
  const knockFeedId = process.env.NEXT_PUBLIC_KNOCK_FEED_ID || "feed_placeholder";

  // If user is not loaded yet, just return a placeholder or nothing
  if (!user || !user.id) return null;

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
