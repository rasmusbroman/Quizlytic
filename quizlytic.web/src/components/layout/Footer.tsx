export default function Footer() {
    return (
      <footer className="bg-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Quizlytic. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    );
  }