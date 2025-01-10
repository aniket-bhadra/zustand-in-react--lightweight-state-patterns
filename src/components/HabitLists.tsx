import React from "react";
import useHabitStore, { Habit } from "../store/store";
import {
  Box,
  Button,
  Grid2,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { CheckCircle, Delete } from "@mui/icons-material";

const HabitLists = () => {
  const { habits, removeHabit, toggleHabit } = useHabitStore();
  const today = new Date().toISOString().split("T")[0];
  //   console.log(today);

  const getStreak = (habit: Habit) => {
    let streak = 0;
    const todayInstance = new Date();
    while (true) {
      let today = todayInstance.toISOString().split("T")[0];
      if (habit.completedDates.includes(today)) {
        streak++;
        todayInstance.setDate(todayInstance.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 4,
      }}
    >
      {habits.map((habit) => (
        <Paper
          key={habit.id}
          elevation={2}
          sx={{
            padding: 2,
          }}
        >
          <Grid2 container alignItems="center">
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6">{habit.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {habit.name}
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Button
                  variant="outlined"
                  color={
                    habit.completedDates.includes(today) ? "success" : "primary"
                  }
                  startIcon={<CheckCircle />}
                  onClick={() => toggleHabit(habit.id, today)}
                >
                  {habit.completedDates.includes(today)
                    ? "Completed"
                    : "Mark Complete"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => {
                    removeHabit(habit.id);
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Grid2>
          </Grid2>

          <Box sx={{ mt: 2 }}>
            <Typography>Current Streak : {getStreak(habit)}</Typography>
            <LinearProgress
              variant="determinate"
              value={(getStreak(habit) / 30) * 100}
              sx={{ mt: 2 }}
            />
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default HabitLists;
