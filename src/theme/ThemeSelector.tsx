import { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { getStoredTheme, themes } from "./themes";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

function useThemeStorage() {
  const [theme, setTheme] = useState<string>(() => getStoredTheme().name);

  useEffect(() => {
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [theme]);

  return [theme, setTheme] as const;
}

export function ThemeSelector() {
  const muiTheme = useTheme();
  const [selectedTheme, setSelectedTheme] = useThemeStorage();
  const [storageIsAvailable] = useState(() => {
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
    } catch (error) {
      return false;
    }
  });

  if (!storageIsAvailable) {
    return (
      <Alert severity="error" sx={{ height: "240px" }}>
        <AlertTitle>Storage is not available</AlertTitle>
        The plugin is unable to change the theme. Please enable third-party
        cookies.
      </Alert>
    );
  }

  return (
    <Stack>
      <RadioGroup
        aria-label="theme"
        value={selectedTheme}
        onChange={(_, value) => setSelectedTheme(value)}
        name="themes"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1,
        }}
      >
        {themes.map((theme) => (
          <Box
            key={theme.name}
            sx={{
              position: "relative",
              "&:hover .theme-background": {
                opacity: theme.name === selectedTheme ? 0.6 : 0.3,
              },
            }}
          >
            <FormControlLabel
              value={theme.name}
              control={
                <Radio
                  color={
                    muiTheme.palette.mode === "light" ? "default" : "secondary"
                  }
                />
              }
              label={theme.name}
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 1,
                py: 0.5,
              }}
              slotProps={{
                typography: {
                  fontWeight: 500,
                },
              }}
            />
            <Box
              className="theme-background"
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: -1,
                overflow: "hidden",
                opacity: theme.name === selectedTheme ? 0.5 : 0.2,
                transition: "opacity 0.2s ease-in-out",
                borderRadius: "12px",
              }}
              aria-hidden="true"
            >
              <Box
                sx={{
                  transform: "skew(-15deg) scale(1.1)",
                  display: "flex",
                  width: "100%",
                  height: "100%",
                }}
              >
                {theme.colors.map((color) => (
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                    }}
                    key={color.r + color.g + color.b}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        ))}
      </RadioGroup>
    </Stack>
  );
}
