import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";
import type { TourSummary } from "../api/tour-schemas";
import { TourCard } from "./TourCard";

const tour: TourSummary = {
  id: "t1",
  title: "کویر مصر",
  destination: "روستای مصر",
  province: "یزد",
  coverImageUrl: "/images/tours/tour-mesr-desert.webp",
  startDate: "2030-01-10",
  endDate: "2030-01-12",
  durationDays: 3,
  priceToman: 3_200_000,
  capacity: 12,
  minParticipants: 8,
  confirmedCount: 5,
  difficulty: "easy",
  categories: ["camping"],
  badge: "special_offer",
  rating: 4.5,
  reviewCount: 10,
  status: "open",
  createdAt: "2029-12-01T10:00:00.000Z",
};

describe("TourCard", () => {
  it("shows destination, dates, budget and capacity like the Figma card", () => {
    renderRoute(<TourCard tour={tour} />);
    expect(screen.getByRole("link", { name: "کویر مصر" })).toHaveAttribute(
      "href",
      "/tours/t1",
    );
    expect(screen.getByText(/روستای مصر، یزد/)).toBeInTheDocument();
    expect(screen.getByText("کمپینگ")).toBeInTheDocument();
    expect(screen.getByText("۳٬۲۰۰٬۰۰۰")).toBeInTheDocument();
    expect(screen.getByText("برای هر نفر")).toBeInTheDocument();
    expect(screen.getByLabelText(/ظرفیت: ۵ نفر از ۱۲ نفر/)).toBeInTheDocument();
    // `open` is the default listing state, so no status pill.
    expect(screen.queryByText("در حال تکمیل ظرفیت")).not.toBeInTheDocument();
  });

  it("shows the status pill for other states", () => {
    renderRoute(<TourCard tour={{ ...tour, status: "cancelled" }} />);
    expect(screen.getByText("لغو شده")).toBeInTheDocument();
  });
});
