import styled, { keyframes } from "styled-components";

const pulseLine = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.3;
    transform: scaleY(0.6);
  }
`;

const verifiedDotPulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.7);
  }
`;

export const PageWrapper = styled.div`
  min-height: 100vh;
  background: #0a0a14;
  color: #fafaf8;
  position: relative;
`;

export const ReadProgressBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: ${(props) => `${props.$progress || 0}%`};
  background: #f5a623;
  z-index: 999;
  transition: width 0.1s linear;
`;

export const StickyNav = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10, 10, 20, 0.92);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

export const NavInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  height: 64px;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 0 1.25rem;
  }
`;

export const NavBack = styled.button`
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  border: 1px solid rgba(136, 136, 170, 0.4);
  background: transparent;
  color: #8888aa;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f5a623;
    color: #f5a623;
  }
`;

export const NavTitle = styled.div`
  max-width: 400px;
  font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-size: 0.95rem;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;

  @media (max-width: 600px) {
    max-width: 200px;
  }
`;

export const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const NavShareBtn = styled.button`
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #d0d0e0;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f5a623;
    color: #f5a623;
  }
`;

export const NavCategoryPill = styled.span`
  border-radius: 999px;
  padding: 0.35rem 1rem;
  font-size: 0.8rem;
  border: 1px solid rgba(245, 166, 35, 0.3);
  background: rgba(245, 166, 35, 0.15);
  color: #f5a623;
`;

export const HeroSection = styled.section`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
`;

export const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  background: #0a0a14;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.3;
    transform: translateY(${(props) => props.$parallaxY || 0}px);
    will-change: transform;
  }
`;

export const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 20, 0.1) 0%,
    rgba(10, 10, 20, 0.5) 50%,
    rgba(10, 10, 20, 0.9) 80%,
    #0a0a14 100%
  );
`;

export const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  padding: 120px clamp(2rem, 8vw, 8rem) 5rem;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 110px 1.5rem 3.5rem;
  }
`;

export const Breadcrumb = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.85rem;
  font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
`;

export const BreadcrumbLink = styled.span`
  color: ${(props) => (props.$active ? "#ffffff" : "#8888aa")};
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};
  transition: color 0.2s ease;

  &:hover {
    color: ${(props) => (props.$clickable ? "#f5a623" : undefined)};
  }
`;

export const BreadcrumbSep = styled.span`
  color: #55556a;
`;

export const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

export const CategoryBadge = styled.span`
  border-radius: 999px;
  padding: 0.4rem 1.2rem;
  font-size: 0.82rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #f5a623;
  color: #0a0a14;
`;

export const MetaBadge = styled.span`
  border-radius: 999px;
  padding: 0.4rem 1.1rem;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #bbbbcc;
`;

export const HeroTitle = styled.h1`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 900;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin-bottom: 1.2rem;
`;

export const HeroClientRow = styled.div`
  font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  font-size: 1.1rem;
  color: #f5a623;

  span {
    color: #8888aa;
    margin-right: 0.25rem;
  }
`;

export const HeroDesc = styled.p`
  margin-top: 1rem;
  max-width: 600px;
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  line-height: 1.85;
  color: rgba(255, 255, 255, 0.65);
`;

export const HeroButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2.5rem;
`;

export const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 0.3s ease;
`;

export const ScrollLine = styled.div`
  width: 2px;
  height: 40px;
  border-radius: 999px;
  background: #f5a623;
  opacity: 1;
  transform-origin: top center;
  animation: ${pulseLine} 1.8s ease-in-out infinite;
`;

export const ScrollText = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #8888aa;
`;

export const OverviewBand = styled.section`
  width: 100%;
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 3rem 0;
`;

export const OverviewInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 clamp(1.5rem, 6vw, 2.5rem);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 24px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const OverviewItem = styled.div`
  padding: 1.5rem 1rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-right: none;
  }

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);

    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }
  }
`;

export const OverviewLabel = styled.span`
  display: block;
  color: #8888aa;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 0.4rem;
`;

export const OverviewValue = styled.span`
  display: block;
  color: #fafaf8;
  font-size: 0.95rem;
  font-weight: 500;
`;

export const ImpactSection = styled.section`
  padding: 7rem clamp(2rem, 8vw, 8rem);
  background: #0a0a14;
`;

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  margin-top: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const MetricCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(245, 166, 35, 0.08),
    rgba(245, 166, 35, 0.02)
  );
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  border: 1px solid rgba(245, 166, 35, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(245, 166, 35, 0.5);
    transform: translateY(-6px);
  }
`;

export const MetricValue = styled.div`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 900;
  color: #f5a623;
  line-height: 1;
`;

export const MetricLabel = styled.span`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8888aa;
`;

export const MetricAccent = styled.div`
  height: 2px;
  width: 40px;
  margin: 1.5rem auto 0;
  border-radius: 2px;
  background: linear-gradient(to right, #f5a623, transparent);
`;

export const TechTagsRow = styled.div`
  margin-top: 4rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
`;

export const TechTag = styled.span`
  border-radius: 50px;
  padding: 0.4rem 1.2rem;
  font-size: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #bbbbcc;
  transition: all 0.2s ease;

  &:hover {
    border-color: #f5a623;
    color: #f5a623;
  }
`;

export const StorySection = styled.section`
  padding: 7rem clamp(2rem, 8vw, 8rem);
  background: #0a0a14;
`;

export const StoryGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 4rem;

  @media (max-width: 992px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const MainCol = styled.div``;

export const SidebarCol = styled.aside`
  position: sticky;
  top: 90px;
  align-self: flex-start;
`;

export const SubSection = styled.section`
  margin-bottom: 5rem;
  position: relative;
`;

export const SubLabel = styled.span`
  display: block;
  margin-bottom: 0.8rem;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 500;
  color: #f5a623;
`;

export const SubHeading = styled.h2`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.7rem;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 1.2rem;
`;

export const StoryBody = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  line-height: 1.9;
  font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
`;

export const QuoteMark = styled.span`
  position: absolute;
  top: -3rem;
  left: -2rem;
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 14rem;
  color: rgba(245, 166, 35, 0.04);
  line-height: 1;
  pointer-events: none;
`;

export const ChallengeBlock = styled.div`
  position: relative;
  border-left: 4px solid rgba(239, 68, 68, 0.6);
  background: rgba(239, 68, 68, 0.04);
  border-radius: 0 16px 16px 0;
  padding: 1.8rem 2rem;
`;

export const SolutionBlock = styled.div`
  position: relative;
  border-left: 4px solid rgba(16, 185, 129, 0.6);
  background: rgba(16, 185, 129, 0.04);
  border-radius: 0 16px 16px 0;
  padding: 1.8rem 2rem;
`;

export const BulletList = styled.ul`
  margin-top: 1.5rem;
  display: grid;
  gap: 0.75rem;
`;

export const BulletItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.65);
`;

export const BulletDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  margin-top: 7px;
  flex-shrink: 0;
  background: ${(props) => props.$color || "#ef4444"};
`;

export const Timeline = styled.div`
  position: relative;
  padding-left: 3.5rem;
  margin-top: 1rem;

  &::before {
    content: "";
    position: absolute;
    left: 23px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      to bottom,
      #f5a623 0%,
      rgba(245, 166, 35, 0.3) 60%,
      transparent 100%
    );
  }
`;

export const TimelineStep = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
`;

export const StepCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f5a623, #c4811a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0a0a14;
  flex-shrink: 0;
`;

export const StepBody = styled.div``;

export const StepNum = styled.div`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #f5a623;
  margin-bottom: 0.25rem;
`;

export const StepName = styled.h3`
  font-size: 1.05rem;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

export const StepDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.7);
`;

export const OutcomeBox = styled.div`
  margin-top: 2rem;
  border-radius: 20px;
  padding: 2rem 2.5rem;
  background: linear-gradient(
    135deg,
    rgba(108, 43, 217, 0.1),
    rgba(245, 166, 35, 0.06)
  );
  border: 1px solid rgba(108, 43, 217, 0.2);
`;

export const HighlightItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
`;

export const HighlightCheck = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #10b981;
  flex-shrink: 0;
`;

export const SideCard = styled.div`
  background: #1a1a2e;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.8rem;
  margin-bottom: 1.5rem;
`;

export const SideCardTitle = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #f5a623;
  margin-bottom: 0.75rem;
`;

export const SideRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
`;

export const SideLabel = styled.span`
  font-size: 0.82rem;
  color: #8888aa;
`;

export const SideValue = styled.span`
  font-size: 0.88rem;
  font-weight: 500;
  color: #ffffff;
`;

export const SideTagsRow = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

export const SideTag = styled.span`
  border-radius: 50px;
  padding: 0.25rem 0.7rem;
  font-size: 0.78rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #bbbbcc;
`;

export const SideLiveBtn = styled.a`
  display: block;
  margin-top: 1.5rem;
  width: 100%;
  text-align: center;
  border-radius: 999px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: #f5a623;
  color: #0a0a14;
  text-decoration: none;
`;

export const StatCard = styled.div`
  background: #1a1a2e;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.8rem;
  margin-bottom: 1.5rem;
`;

export const StatValue = styled.div`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f5a623;
`;

export const StatLabel = styled.div`
  font-size: 0.78rem;
  color: #8888aa;
`;

export const CTASideCard = styled.div`
  background: linear-gradient(
    160deg,
    rgba(108, 43, 217, 0.35) 0%,
    rgba(10, 10, 20, 0.9) 100%
  );
  border-radius: 20px;
  border: 1px solid rgba(108, 43, 217, 0.25);
  padding: 1.8rem;
`;

export const CTASideHeading = styled.h3`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.25rem;
  color: #ffffff;
  margin-bottom: 0.8rem;
`;

export const CTASideBody = styled.p`
  font-size: 0.88rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
`;

export const CTASideBtn = styled.button`
  width: 100%;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  background: #f5a623;
  color: #0a0a14;
  border: none;
  cursor: pointer;
`;

export const CTASideNote = styled.div`
  margin-top: 0.8rem;
  font-size: 0.78rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
`;

export const GallerySection = styled.section`
  padding: 7rem clamp(2rem, 8vw, 8rem);
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const GalleryHero = styled.div`
  margin-top: 2rem;
  border-radius: 20px;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid rgba(255, 255, 255, 0.08);
  height: clamp(300px, 45vw, 520px);
  transition: transform 0.35s ease, border-color 0.25s ease;

  &:hover {
    transform: scale(1.02);
    border-color: rgba(245, 166, 35, 0.3);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ScreenGrid = styled.div`
  margin-top: 1.5rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ScreenWrap = styled.div`
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
  cursor: zoom-in;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.35s ease, border-color 0.25s ease;

  &:hover {
    border-color: rgba(245, 166, 35, 0.3);
    transform: scale(1.04);
  }
`;

export const ScreenImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

export const LightboxImg = styled.img`
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 12px;
`;

export const LightboxClose = styled.button`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
`;

export const LightboxArrow = styled.button`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  cursor: pointer;
  ${(props) => (props.$left ? "left: 1.5rem;" : "right: 1.5rem;")}
`;

export const LightboxCounter = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.85rem;
  color: #bbbbcc;
`;

export const TestimonialSection = styled.section`
  padding: 7rem clamp(2rem, 8vw, 8rem);
  padding-top: 0;
  background: #0a0a14;
`;

export const BigQuote = styled.div`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 8rem;
  color: rgba(245, 166, 35, 0.12);
  line-height: 0.6;
  margin-bottom: -1rem;
  user-select: none;
`;

export const QuoteText = styled.p`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-style: italic;
  font-size: clamp(1.25rem, 2.2vw, 1.75rem);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.75;
  margin-bottom: 3rem;
`;

export const AuthorBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
`;

export const AuthorAvatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f5a623, #6c2bd9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
`;

export const AuthorInfo = styled.div``;

export const AuthorName = styled.div`
  font-size: 1.1rem;
  font-weight: 500;
  color: #ffffff;
`;

export const AuthorRole = styled.div`
  font-size: 0.9rem;
  color: #8888aa;
`;

export const QuoteStars = styled.div`
  margin-top: 0.3rem;
  color: #f5a623;
  font-size: 1.1rem;
`;

export const VerifiedBadge = styled.div`
  margin-top: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1.2rem;
  border-radius: 50px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
`;

export const VerifiedDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #10b981;
  display: inline-block;
  animation: ${verifiedDotPulse} 2s ease-in-out infinite;
`;

export const TechSection = styled.section`
  padding: 5rem clamp(2rem, 8vw, 8rem);
  background: #1a1a2e;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const TechGrid = styled.div`
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
`;

export const TechCard = styled.div`
  background: #2d2d4a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(245, 166, 35, 0.3);
  }
`;

export const TechIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

export const TechName = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #ffffff;
`;

export const NavSection = styled.section`
  padding: 5rem clamp(2rem, 8vw, 8rem);
  background: #0a0a14;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

export const NavGrid = styled.div`
  max-width: 900px;
  margin: 2.5rem auto 0;
  display: grid;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const NavCard = styled.div`
  background: #1a1a2e;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(245, 166, 35, 0.3);
  }
`;

export const NavDirection = styled.div`
  padding: 1rem 1.5rem;
  font-size: 0.8rem;
  color: #8888aa;
`;

export const NavImgWrap = styled.div`
  height: 180px;
  overflow: hidden;
  background: #2d2d4a;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 60%;
    background: linear-gradient(to bottom, transparent, rgba(10, 10, 20, 0.8));
    pointer-events: none;
    z-index: 1;
  }

  > img {
    position: relative;
    z-index: 0;
  }
`;

export const NavImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const NavCardBody = styled.div`
  padding: 1.5rem;
`;

export const NavCatBadge = styled.span`
  display: inline-block;
  margin-bottom: 0.35rem;
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.7rem;
  background: rgba(245, 166, 35, 0.15);
  color: #f5a623;
`;

export const NavCardTitle = styled.h3`
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: 1.15rem;
  color: #ffffff;
  font-weight: 600;
  margin-bottom: 0.3rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const NavClient = styled.div`
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #8888aa;
`;

export const BackBtn = styled.button`
  margin-top: 3rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.6rem 1.3rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: transparent;
  color: #d0d0e0;
  cursor: pointer;
`;

export const BottomCta = styled.section`
  position: relative;
  overflow: hidden;
  padding: 8rem clamp(2rem, 8vw, 8rem);
  background: linear-gradient(
    135deg,
    #1a0050 0%,
    #6c2bd9 40%,
    #0a0a14 100%
  );
  text-align: center;
`;

export const CtaOrb = styled.div`
  position: absolute;
  border-radius: 999px;
  filter: blur(${(props) => props.$blur || 100}px);
  background: ${(props) => props.$color || "rgba(245, 166, 35, 0.12)"};
  width: ${(props) => props.$size || 400}px;
  height: ${(props) => props.$size || 400}px;
  top: ${(props) => props.$top || "auto"};
  bottom: ${(props) => props.$bottom || "auto"};
  left: ${(props) => props.$left || "auto"};
  right: ${(props) => props.$right || "auto"};
`;

export const CtaBadge = styled.div`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #f5f5ff;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
`;

export const CtaHeading = styled.h2`
  position: relative;
  z-index: 1;
  margin-top: 1.5rem;
  font-family: "Playfair Display", "Times New Roman", serif;
  font-size: clamp(2.5rem, 4vw, 4rem);
  color: #ffffff;
`;

export const CtaBody = styled.p`
  position: relative;
  z-index: 1;
  margin: 1rem auto 0;
  max-width: 480px;
  font-size: 1.05rem;
  color: rgba(250, 250, 248, 0.85);
`;

export const CtaBtns = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
`;

export const TrustRow = styled.div`
  position: relative;
  z-index: 1;
  margin-top: 2.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2.5rem;
  font-size: 0.85rem;
  color: rgba(244, 244, 255, 0.85);
`;

export const TrustItem = styled.div``;

