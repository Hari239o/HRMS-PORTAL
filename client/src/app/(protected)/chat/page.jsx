"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  ArrowLeft, 
  Shield, 
  Activity,
  AlertCircle,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileActiveView, setMobileActiveView] = useState("list"); // "list" or "chat"
  
  const messagesEndRef = useRef(null);

  const isAdminOrHr = user?.role === "admin" || user?.role === "hr";

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations (Admin/HR only)
  useEffect(() => {
    if (!user || !isAdminOrHr) return;

    setLoadingConversations(true);

    // Listen to conversations collection in real-time
    const q = query(
      collection(db, "conversations"),
      orderBy("lastMessageTimestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setConversations(list);
      setLoadingConversations(false);
    }, (error) => {
      console.error("Error fetching conversations from Firestore:", error);
      setLoadingConversations(false);
    });

    return () => unsubscribe();
  }, [user, isAdminOrHr]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!user) return;

    // For employees, they always chat in their own room (conversationId = user.id)
    const conversationId = isAdminOrHr ? selectedConversation?.id : user.id;

    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);

    const q = query(
      collection(db, "chats"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMessages(list);
      setLoadingMessages(false);

      // Mark messages as read
      if (isAdminOrHr && selectedConversation) {
        const convRef = doc(db, "conversations", conversationId);
        updateDoc(convRef, { unreadCountAdmin: 0 }).catch(console.error);
      } else if (!isAdminOrHr) {
        const convRef = doc(db, "conversations", conversationId);
        updateDoc(convRef, { unreadCountEmployee: 0 }).catch(console.error);
      }
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConversation, user, isAdminOrHr]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const conversationId = isAdminOrHr ? selectedConversation?.id : user.id;
    const receiverId = isAdminOrHr ? selectedConversation?.id : "support";

    const messageText = newMessage;
    setNewMessage("");

    try {
      // 1. Post to PostgreSQL backend (saves message, triggers DB notifications and Knock workflows)
      const payload = {
        receiverId,
        content: messageText,
        conversationId
      };
      
      // Async request to postgres so UI is not blocked
      api.post("/api/messages", payload).catch((err) => {
        console.error("Error syncing message to postgres database:", err);
      });

      // 2. Add to Firestore collection (triggers real-time client UI update)
      await addDoc(collection(db, "chats"), {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        receiverId,
        content: messageText,
        conversationId,
        timestamp: serverTimestamp()
      });

      // 3. Upsert conversation summary in Firestore
      const convRef = doc(db, "conversations", conversationId);
      
      const convData = {
        lastMessage: messageText,
        lastMessageSenderId: user.id,
        lastMessageTimestamp: serverTimestamp(),
      };

      if (isAdminOrHr) {
        convData.unreadCountEmployee = increment(1);
      } else {
        convData.unreadCountAdmin = increment(1);
        convData.employeeId = user.id;
        convData.employeeName = user.name;
        convData.employeeEmail = user.email || "";
        convData.employeeDepartment = user.department || "General";
        convData.employeeAvatar = user.avatar || "";
      }

      await setDoc(convRef, convData, { merge: true });

    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Filter conversations based on query
  const filteredConversations = conversations.filter((c) =>
    c.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.employeeDepartment?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSenderColor = (role) => {
    if (role === "admin" || role === "hr") return "bg-[#ff5a1f]/10 text-[#ff5a1f] border-[#ff5a1f]/20";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // Mobile Back Button
  const handleBackToList = () => {
    setMobileActiveView("list");
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setMobileActiveView("chat");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-slate-50/50 rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Upper Top Navbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5a1f] to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Geonixa Helpdesk & Chat</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time internal support channel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT PANEL: Conversation Directory (Admin/HR only) */}
        {isAdminOrHr && (
          <div className={`w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
            mobileActiveView === "chat" ? "hidden md:flex" : "flex"
          }`}>
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search employees or departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm font-medium border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/20 focus:border-[#ff5a1f]"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#ff5a1f] animate-spin" />
                  <p className="text-xs font-semibold">Synchronizing channels...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                    <Users size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No support tickets found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">When employees send you support messages, they will appear here.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversation?.id === conv.id;
                  const relativeTime = conv.lastMessageTimestamp 
                    ? formatDistanceToNow(conv.lastMessageTimestamp.toDate(), { addSuffix: true }) 
                    : "";
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-4 transition-all flex gap-3 items-start relative hover:bg-slate-50/80 ${
                        isSelected ? "bg-orange-50/50 border-l-4 border-l-[#ff5a1f]" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#ff5a1f] border border-slate-200 relative flex-shrink-0">
                        {conv.employeeAvatar ? (
                          <img src={conv.employeeAvatar} alt={conv.employeeName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User size={18} />
                        )}
                        {conv.unreadCountAdmin > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff5a1f] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                            {conv.unreadCountAdmin}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{conv.employeeName}</h4>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{relativeTime}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{conv.employeeDepartment}</span>
                        <p className="text-xs text-slate-500 font-medium truncate">{conv.lastMessage}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RIGHT PANEL: The Active Chat Container */}
        <div className={`flex-1 flex flex-col bg-white transition-all duration-300 ${
          isAdminOrHr && mobileActiveView === "list" ? "hidden md:flex" : "flex"
        }`}>
          {/* Active Chat Header */}
          {(selectedConversation || !isAdminOrHr) ? (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-3">
              {isAdminOrHr && (
                <button 
                  onClick={handleBackToList}
                  className="p-2 hover:bg-slate-200/60 rounded-lg text-slate-500 md:hidden transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#ff5a1f] relative flex-shrink-0">
                {isAdminOrHr ? (
                  selectedConversation?.employeeAvatar ? (
                    <img src={selectedConversation.employeeAvatar} alt={selectedConversation.employeeName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User size={18} />
                  )
                ) : (
                  <Shield size={18} />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAdminOrHr ? selectedConversation?.employeeName : "Geonixa Help & Support Team"}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {isAdminOrHr ? `${selectedConversation?.employeeDepartment} Department` : "Always active to help you"}
                </span>
              </div>
            </div>
          ) : null}

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {(!selectedConversation && isAdminOrHr) ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                  <MessageSquare size={28} />
                </div>
                <h3 className="text-base font-bold text-slate-800">Select a Conversation</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">Choose an employee from the directory list on the left to review support tickets and send replies.</p>
              </div>
            ) : loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#ff5a1f] animate-spin" />
                <p className="text-xs font-semibold">Fetching chat transcripts...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center max-w-sm mx-auto">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-3 border border-slate-100">
                  <AlertCircle size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Messages Yet</h4>
                <p className="text-xs text-slate-400 mt-1">Send a message below to start the support ticket. Messages update in real-time instantly.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                const formattedTime = msg.timestamp 
                  ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "";
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-slate-500">{msg.senderName}</span>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${getSenderColor(msg.senderRole)}`}>
                        {msg.senderRole}
                      </span>
                    </div>
                    
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border ${
                      isMe 
                        ? "bg-[#ff5a1f] text-white border-[#e04812] rounded-tr-none" 
                        : "bg-slate-50 text-slate-800 border-slate-200 rounded-tl-none"
                    }`}>
                      <p className="leading-relaxed break-words font-medium whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-[9px] font-medium block text-right mt-1.5 ${
                        isMe ? "text-orange-100" : "text-slate-400"
                      }`}>
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          {(selectedConversation || !isAdminOrHr) && (
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a support message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]/20 focus:border-[#ff5a1f] text-sm font-medium shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-5 py-3 bg-[#ff5a1f] hover:bg-[#e04812] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 flex-shrink-0"
                >
                  <span className="hidden sm:inline">Send</span>
                  <Send size={15} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
