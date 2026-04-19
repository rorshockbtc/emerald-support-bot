import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { ContactProvider } from "@/components/ContactContext";
import Home from "@/pages/Home";
import About from "@/pages/About";
import OpenClaw from "@/pages/OpenClaw";
import PersonaPage from "@/pages/PersonaPage";
import DemoHolding from "@/pages/DemoHolding";
import BlockstreamDemo from "@/pages/BlockstreamDemo";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Live Blockstream demo — preserved as the original Emerald
          experience. Renders without the Greater Layout chrome to keep
          the Blockstream-branded support page authentic, but still has
          access to the contact modal via the ContactProvider above. */}
      <Route path="/demo/blockstream" component={BlockstreamDemo} />

      {/* Greater shell routes — wrapped in Layout (nav + footer + bottom
          mobile nav + AnimatePresence page transitions). */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/openclaw" component={OpenClaw} />
            <Route path="/bots/:slug" component={PersonaPage} />
            <Route path="/demo/:slug" component={DemoHolding} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ContactProvider>
          <Router />
        </ContactProvider>
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
