import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Partner_Home from "./pages/Partner_Home";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SolutionMarket from "./pages/SolutionMarket";
import UsageGuide from "./pages/UsageGuide";
import Signup from "./pages/Signup";
import OAuthKakaoCallback from "./pages/OAuthKakaoCallback";
import Mypage from "./pages/Mypage";
import Loading from "./pages/Loading";
import PartnerRegister from "./pages/PartnerRegister";
import ClientRegister from "./pages/ClientRegister";
import Client_Home from "./pages/Client_Home";
import PartnerSearch from "./pages/PartnerSearch";
import ClientSearch from "./pages/ClientSearch";
import ProjectSearch from "./pages/ProjectSearch";
import PartnerProfile from "./pages/PartnerProfile";
import Client_Profile from "./pages/Client_Profile";
import Partner_Portfolio from "./pages/Partner_Portfolio";
import Client_Portfolio from "./pages/Client_Portfolio";
import PortfolioDetailEditor from "./pages/PortfolioDetailEditor";
import PortfolioProjectPreview from "./pages/PortfolioProjectPreview";
import ProjectRegister from "./pages/ProjectRegister";
import AIchatProject from "./pages/AIchatProject";
import AIchatProfile from "./pages/AIchatProfile";
import AIchatPortfolio from "./pages/AIchatPortfolio";
import PartnerDashboard from "./pages/PartnerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import SolutionDetail from "./pages/SolutionDetail";
import FindPassword from "./pages/FindPassword";
import UsageGuide_Portfolio from "./pages/UsageGuide_Portfolio";
import PartnerProfileView from "./pages/PartnerProfileView";
import ClientProfileView from "./pages/ClientProfileView";
import UsageGuide_Matching from "./pages/UsageGuide_Matching";
import UsageGuide_Contract from "./pages/UsageGuide_Contract";
import UsageGuide_Policy from "./pages/UsageGuide_Policy";
import Onboarding from "./pages/Onboarding";
import StreamChatPage from "./pages/StreamChatPage";
import ChatBot from "./components/ChatBot";
import Footer from "./components/ui/Footer";


function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const noFooterPaths = ["/", "/loading", "/oauth/kakao/callback"];
  const showFooter = !noFooterPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/partner_home" element={<Partner_Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/solution_market" element={<SolutionMarket />} />
        <Route path="/solution_detail" element={<SolutionDetail />} />
        <Route path="/usage_guide" element={<UsageGuide />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/oauth/kakao/callback" element={<OAuthKakaoCallback />} />
        <Route path="/loading" element={<Loading />} />
        <Route path="/partner_register" element={<PartnerRegister />} />
        <Route path="/client_register" element={<ClientRegister />} />
        <Route path="/client_home" element={<Client_Home />} />
        <Route path="/partner_search" element={<PartnerSearch />} />
        <Route path="/client_search" element={<ClientSearch />} />
        <Route path="/partner_profile_view" element={<PartnerProfileView />} />
        <Route path="/client_profile_view" element={<ClientProfileView />} />
        <Route path="/project_search" element={<ProjectSearch />} />
        <Route path="/partner_profile" element={<PartnerProfile />} />
        <Route path="/client_profile" element={<Client_Profile />} />
        <Route path="/partner_portfolio" element={<Partner_Portfolio />} />
        <Route path="/client_portfolio" element={<Client_Portfolio />} />
        <Route path="/portfolio_detail_editor" element={<PortfolioDetailEditor />} />
        <Route path="/portfolio_project_preview" element={<PortfolioProjectPreview />} />
        <Route path="/project_register" element={<ProjectRegister />} />
        <Route path="/ai_chat_project" element={<AIchatProject />} />
        <Route path="/ai_chat_profile" element={<AIchatProfile />} />
        <Route path="/aichat_portfolio" element={<AIchatPortfolio />} />
        <Route path="/partner_dashboard" element={<PartnerDashboard />} />
        <Route path="/client_dashboard" element={<ClientDashboard />} />
        <Route path="/find-password" element={<FindPassword />} />
        <Route path="/usage_guide/portfolio" element={<UsageGuide_Portfolio />} />
        <Route path="/usage_guide/matching" element={<UsageGuide_Matching />} />
        <Route path="/usage_guide/contract" element={<UsageGuide_Contract />} />
        <Route path="/usage_guide/policy" element={<UsageGuide_Policy />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/chat" element={<StreamChatPage />} />
      </Routes>
      {showFooter && <Footer />}
      {!isLandingPage && <ChatBot />}
    </>
  );
}

export default App;
