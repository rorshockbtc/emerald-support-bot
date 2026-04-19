import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
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
      {/* Live Blockstream demo — preserved exactly as the original Emerald
          experience. Renders without the Greater layout chrome to keep the
          Blockstream-branded support page authentic. */}
      <Route path="/demo/blockstream" component={BlockstreamDemo} />

      {/* Greater shell routes — wrapped in Layout (nav + footer + contact). */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/openclaw" component={OpenClaw} />
            <Route path="/personas/:slug" component={PersonaPage} />
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
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
