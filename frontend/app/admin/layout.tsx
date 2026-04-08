import '../../styles/globals.css';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#ede0d4' }}>{children}</body>
    </html>
  );
};

export default AdminLayout;
