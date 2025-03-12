import React from "react";
import { ConnectionState } from "@/lib/signalr-client";
import { IoWifi, IoWifiOutline, IoRefresh, IoWarning } from "react-icons/io5";

interface ConnectionStatusIndicatorProps {
  status: ConnectionState;
  error: string | null;
  onReconnect: () => Promise<boolean>;
  showDetailed?: boolean;
  className?: string;
}

const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  status,
  error,
  onReconnect,
  showDetailed = false,
  className = "",
}) => {
  if (status === ConnectionState.Connected && !showDetailed) {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case ConnectionState.Connected:
        return "text-green-500";
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case ConnectionState.Connected:
        return <IoWifi className="w-5 h-5" />;
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return <IoWifiOutline className="w-5 h-5 animate-pulse" />;
      default:
        return <IoWarning className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case ConnectionState.Connected:
        return "Connected";
      case ConnectionState.Connecting:
        return "Connecting...";
      case ConnectionState.Reconnecting:
        return "Reconnecting...";
      case ConnectionState.ConnectionFailed:
        return "Connection failed";
      case ConnectionState.ConnectionTimedOut:
        return "Connection timed out";
      default:
        return "Disconnected";
    }
  };

  const handleReconnect = async () => {
    await onReconnect();
  };

  return (
    <div
      className={`rounded-md p-3 flex items-center justify-between ${className} ${
        status !== ConnectionState.Connected
          ? "bg-yellow-50 border border-yellow-200"
          : "bg-green-50 border border-green-200"
      }`}
    >
      <div className="flex items-center">
        <span className={`mr-2 ${getStatusColor()}`}>{getStatusIcon()}</span>
        <span className="text-sm font-medium">{getStatusText()}</span>
        {error && <span className="ml-2 text-sm text-red-600">{error}</span>}
      </div>

      {status !== ConnectionState.Connected &&
        status !== ConnectionState.Connecting &&
        status !== ConnectionState.Reconnecting && (
          <button
            onClick={handleReconnect}
            className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <IoRefresh className="w-4 h-4 mr-1" />
            Reconnect
          </button>
        )}
    </div>
  );
};

export default ConnectionStatusIndicator;
