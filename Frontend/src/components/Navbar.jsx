import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const Navbar = () => {
  const [currentSection, setCurrentSection] = useState("hero");
  const navigate = useNavigate();

  // Dropdown state
  const [userAnchorEl, setUserAnchorEl] = useState(null);
  const [restAnchorEl, setRestAnchorEl] = useState(null);

  const openUserMenu = Boolean(userAnchorEl);
  const openRestMenu = Boolean(restAnchorEl);

  const handleUserClick = (event) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleRestClick = (event) => {
    setRestAnchorEl(event.currentTarget);
  };

  const handleCloseMenus = () => {
    setUserAnchorEl(null);
    setRestAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleCloseMenus();
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: "hero", element: document.querySelector(".hero-section") },
        { id: "stats", element: document.querySelector(".stats-section") },
        { id: "mission", element: document.querySelector(".mission-section") },
        {
          id: "how-it-works",
          element: document.querySelector(".how-it-works-section"),
        },
        {
          id: "features",
          element: document.querySelector(".features-section"),
        },
        {
          id: "testimonials",
          element: document.querySelector(".testimonials-section"),
        },
        { id: "faq", element: document.querySelector(".faq-section") },
        { id: "cta", element: document.querySelector(".cta-section") },
        { id: "footer", element: document.querySelector(".footer-section") },
      ];

      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        if (!section.element) continue;

        const sectionTop = section.element.offsetTop;
        const sectionHeight = section.element.offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          setCurrentSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getNavbarStyle = () => {
    switch (currentSection) {
      case "hero":
        return "white";
      case "mission":
      case "features":
      case "cta":
        return "#fdc3c2";
      case "how-it-works":
      case "testimonials":
        return "#ffc595";
      default:
        return window.scrollY > 50 ? "#ffffff" : "transparent";
    }
  };

  const getTextColor = () => {
    switch (currentSection) {
      case "hero":
        return "#000";
      case "mission":
      case "features":
      case "cta":
      case "how-it-works":
      case "testimonials":
        return "#fff";
      default:
        return "#000";
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={window.scrollY > 50 ? 4 : 0}
      style={{
        backgroundColor: getNavbarStyle(),
        transition: "background-color 0.3s",
        color: getTextColor(),
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Left - Restaurant Icon */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <Button onClick={handleRestClick} sx={{ p: 0 }}>
            <img
              src="src/assets/restaurant_icon.png"
              alt="Restaurant Icon"
              style={{ height: 60 }}
            />
          </Button>
          <Menu
            anchorEl={restAnchorEl}
            open={openRestMenu}
            onClose={handleCloseMenus}
          >
            <MenuItem onClick={() => handleNavigate("/restaurant-login")}>
              Login
            </MenuItem>
            <MenuItem onClick={() => handleNavigate("/restaurant-register")}>
              Register
            </MenuItem>
          </Menu>
        </Box>

        {/* Center - ChowPal Logo */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <img
            src="src/assets/chowpal_logo.png"
            alt="ChowPal Logo"
            style={{ height: 60 }}
          />
        </Box>

        {/* Right - User Icon */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={handleUserClick} sx={{ p: 0 }}>
            <img
              src="src/assets/user.png"
              alt="User Icon"
              style={{ height: 50 }}
            />
          </Button>
          <Menu
            anchorEl={userAnchorEl}
            open={openUserMenu}
            onClose={handleCloseMenus}
          >
            <MenuItem onClick={() => handleNavigate("/user-login")}>
              Login
            </MenuItem>
            <MenuItem onClick={() => handleNavigate("/user-register")}>
              Register
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
