import Header from '../components/custom/Header';
import Footer from '../view-trip/components/Footer';
import ChatBot from '../components/custom/ChatBot';

function ChatBotPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <ChatBot onClose={() => {}} />
      </div>
      <Footer />
    </div>
  );
}

export default ChatBotPage;
