import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// T19: the dropoff label should flip to "Device received" once the job has
// left the `received` stage (via Start Diagnosing or Skip to Repairing),
// instead of always showing the pre-arrival dropoff copy.
import { CustomerDeviceCard } from "./CustomerDeviceCard";

function baseJob(over = {}) {
  return {
    customer: { name: "Cust", phone: "0240000000" },
    deviceBrand: "Apple",
    deviceModel: "iPhone 12",
    deviceType: "phone",
    faultDescription: "Cracked screen",
    dropoff: "customer",
    status: "received",
    ...over,
  };
}

describe("CustomerDeviceCard (T19)", () => {
  it("shows the pre-arrival dropoff copy while status is still 'received'", () => {
    render(<CustomerDeviceCard job={baseJob({ dropoff: "customer", status: "received" })} />);
    expect(screen.getByText("Customer will bring device in")).toBeInTheDocument();
    expect(screen.queryByText("Device received")).not.toBeInTheDocument();
  });

  it("shows the rider-pickup copy while status is still 'received'", () => {
    render(<CustomerDeviceCard job={baseJob({ dropoff: "rider", status: "received", pickupAddress: "12 Ring Rd" })} />);
    expect(screen.getByText("Rider pickup requested")).toBeInTheDocument();
    expect(screen.getByText("12 Ring Rd")).toBeInTheDocument();
  });

  it("switches to 'Device received' once diagnosing has started", () => {
    render(<CustomerDeviceCard job={baseJob({ dropoff: "customer", status: "diagnosing" })} />);
    expect(screen.getByText("Device received")).toBeInTheDocument();
    expect(screen.queryByText("Customer will bring device in")).not.toBeInTheDocument();
  });

  it("switches to 'Device received' when skipped straight to repairing", () => {
    render(<CustomerDeviceCard job={baseJob({ dropoff: "rider", status: "repairing" })} />);
    expect(screen.getByText("Device received")).toBeInTheDocument();
    expect(screen.queryByText("Rider pickup requested")).not.toBeInTheDocument();
  });

  it("keeps showing 'Device received' for later statuses (ready/collected/cancelled)", () => {
    for (const status of ["ready", "collected", "cancelled"]) {
      const { unmount } = render(<CustomerDeviceCard job={baseJob({ status })} />);
      expect(screen.getByText("Device received")).toBeInTheDocument();
      unmount();
    }
  });
});
