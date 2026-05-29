import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import ConnectionStatus from './ConnectionStatus';


const Header = ({ cartCount = 0, showCart = true, showAdmin = true, connected }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="bg-linear-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/20 sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition">
                        <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/15 text-2xl shadow-inner">🍕</span>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">FoodTrack</h1>
                            <p className="text-xs text-indigo-200">Real-time Order Tracking</p>
                        </div>
                    </Link>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {/* Cart - Always Visible */}
                        {showCart && (
                            <button
                                onClick={() => navigate('/cart')}
                                className="relative hover:bg-white/10 px-3 py-2 rounded-xl transition active:scale-95"
                            >
                                <span className="text-2xl">🛒</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md shadow-rose-500/40">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-3">
                            <ConnectionStatus connected={connected} />

                            {/* Order History link -- aage kothao theke /orders e jawar path chilo na */}
                            <Link
                                to="/orders"
                                className="hover:bg-white/10 px-4 py-2 rounded-xl transition font-medium"
                            >
                                📦 Orders
                            </Link>

                            {showAdmin && (
                                <Link
                                    to="/admin"
                                    className="hover:bg-white/10 px-4 py-2 rounded-xl transition font-medium"
                                >
                                    👨‍💼 Admin
                                </Link>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-white/10 transition text-2xl"
                        >
                            {isMenuOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full glass shadow-xl border-t border-white/40 p-4 flex flex-col gap-3 animate-fade-in text-slate-800">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-500">Status</span>
                            <ConnectionStatus connected={connected} />
                        </div>

                        <Link
                            to="/orders"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition font-medium text-slate-700"
                        >
                            <span>📦</span>
                            <span>My Orders</span>
                        </Link>

                        {showAdmin && (
                            <Link
                                to="/admin"
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition font-medium text-slate-700"
                            >
                                <span>👨‍💼</span>
                                <span>Admin Dashboard</span>
                            </Link>
                        )}

                        <button
                            onClick={() => { setIsMenuOpen(false); navigate('/'); }}
                            className="text-left px-4 py-3 hover:bg-slate-50 rounded-xl transition text-slate-600"
                        >
                            Home
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
