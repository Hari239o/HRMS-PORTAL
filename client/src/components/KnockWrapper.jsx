"use client";
import React from "react";
import { KnockProvider, KnockFeedProvider } from "@knocklabs/react";
import "@knocklabs/react/dist/index.css";
import PushNotificationManager from "./PushNotificationManager";

export default function KnockWrapper({ user, children }) {
  const publicApiKey = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY;
  const feedChannelId = process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID;

  if (!publicApiKey || !feedChannelId || !user?.id) {
    return <>{children}</>;
  }

  return (
    <KnockProvider apiKey={publicApiKey} userId={user.id}>
      <KnockFeedProvider feedId={feedChannelId}>
        {children}
        <PushNotificationManager user={user} />
      </KnockFeedProvider>
    </KnockProvider>
  );
}
