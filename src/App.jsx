import React, { useState, useEffect } from 'react';
import { Moon, Sun, Clock, Activity, Coffee, Book, Tv, Dumbbell, Bath, AlertCircle, TrendingUp, Calendar, Download, Save, Trash2, BarChart3, Zap, Brain, Heart, Wind, Droplets, ChevronDown, ChevronUp, MessageCircle, Send, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function BedtimeRoutineApp() {
    const [wakeTime, setWakeTime] = useState('07:00');
    const [tiredness, setTiredness] = useState(5);
    const [sleepQuality, setSleepQuality] = useState(5);
    const [activities, setActivities] = useState({
        exercise: false,
        screenTime: false,
        reading: false,
        heavyMeal: false,
        caffeine: false,
        shower: false,
        meditation: false,
        alcohol: false,
        nap: false
    });
    const [routine, setRoutine] = useState(null);
    const [sleepLog, setSleepLog] = useState([]);
    const [showStats, setShowStats] = useState(false);
    const [showTimeline, setShowTimeline] = useState(true);
    const [savedRoutines, setSavedRoutines] = useState([]);
    const [showAICoach, setShowAICoach] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [preferences] = useState({
        relaxationTime: 30
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [logResult, routinesResult, chatResult] = await Promise.all([
                window.storage.get('sleep-log').catch(() => null),
                window.storage.get('saved-routines').catch(() => null),
                window.storage.get('chat-messages').catch(() => null)
            ]);

            if (logResult?.value) setSleepLog(JSON.parse(logResult.value));
            if (routinesResult?.value) setSavedRoutines(JSON.parse(routinesResult.value));
            if (chatResult?.value) setChatMessages(JSON.parse(chatResult.value));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const calculateSleepCycles = (hours) => {
        return Math.round(hours / 1.5);
    };

    const generateDetailedTimeline = (windDownTime, bedtime, wakeTime, sleepDuration) => {
        const timeline = [];
        const [windHour, windMin] = windDownTime.split(':').map(Number);
        const [bedHour, bedMin] = bedtime.split(':').map(Number);
        const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

        const calcTime = (baseHour, baseMin, offsetMin) => {
            let hour = baseHour;
            let min = baseMin + offsetMin;

            while (min >= 60) {
                min -= 60;
                hour += 1;
            }
            while (min < 0) {
                min += 60;
                hour -= 1;
            }
            if (hour >= 24) hour -= 24;
            if (hour < 0) hour += 24;

            return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        };

        timeline.push({
            time: calcTime(windHour, windMin, -90),
            title: 'Light Dinner',
            description: 'Finish eating 2-3 hours before bed',
            icon: Coffee,
            phase: 'preparation'
        });

        timeline.push({
            time: calcTime(windHour, windMin, -60),
            title: 'Stop Caffeine',
            description: 'Last chance for any caffeinated beverages',
            icon: Coffee,
            phase: 'preparation'
        });

        if (activities.exercise) {
            timeline.push({
                time: calcTime(windHour, windMin, -30),
                title: 'Finish Exercise',
                description: 'Complete workout at least 3 hours before bed',
                icon: Dumbbell,
                phase: 'preparation'
            });
        }

        timeline.push({
            time: windDownTime,
            title: 'Wind-Down Begins',
            description: 'Start your evening relaxation routine',
            icon: Wind,
            phase: 'winddown',
            important: true
        });

        timeline.push({
            time: calcTime(windHour, windMin, 5),
            title: 'Dim the Lights',
            description: 'Reduce bright lights to boost melatonin',
            icon: Sun,
            phase: 'winddown'
        });

        if (activities.screenTime) {
            timeline.push({
                time: calcTime(windHour, windMin, 10),
                title: 'Stop Screen Time',
                description: 'Turn off all electronic devices',
                icon: Tv,
                phase: 'winddown'
            });
        }

        if (activities.shower) {
            timeline.push({
                time: calcTime(windHour, windMin, 15),
                title: 'Warm Shower/Bath',
                description: 'Lower body temperature signals sleep time',
                icon: Bath,
                phase: 'winddown'
            });
        }

        if (activities.meditation || activities.reading) {
            timeline.push({
                time: calcTime(bedHour, bedMin, -20),
                title: 'Relaxation Activity',
                description: activities.meditation ? 'Meditation or deep breathing' : 'Light reading',
                icon: activities.meditation ? Brain : Book,
                phase: 'winddown'
            });
        }

        timeline.push({
            time: calcTime(bedHour, bedMin, -10),
            title: 'Prepare Bedroom',
            description: 'Cool room (60-67°F), dark, quiet',
            icon: Moon,
            phase: 'winddown'
        });

        timeline.push({
            time: bedtime,
            title: 'Lights Out',
            description: 'Time to sleep - aim to fall asleep within 20 min',
            icon: Moon,
            phase: 'sleep',
            important: true
        });

        const cycles = calculateSleepCycles(sleepDuration);
        for (let i = 1; i <= cycles; i++) {
            const cycleTime = calcTime(bedHour, bedMin, i * 90);
            timeline.push({
                time: cycleTime,
                title: `Sleep Cycle ${i} Complete`,
                description: i % 2 === 0 ? 'Deep sleep phase' : 'REM sleep phase',
                icon: Brain,
                phase: 'sleep',
                cycle: true
            });
        }

        timeline.push({
            time: wakeTime,
            title: 'Wake Up Time',
            description: 'Rise and shine! Start your day refreshed',
            icon: Sun,
            phase: 'wake',
            important: true
        });

        timeline.push({
            time: calcTime(wakeHour, wakeMin, 15),
            title: 'Morning Light',
            description: 'Get sunlight exposure to set circadian rhythm',
            icon: Sun,
            phase: 'wake'
        });

        return timeline;
    };

    const calculateRoutine = () => {
        const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

        let sleepHours;
        if (tiredness <= 3) sleepHours = 7 + (tiredness * 0.17);
        else if (tiredness <= 6) sleepHours = 7.5 + ((tiredness - 3) * 0.17);
        else sleepHours = 8 + ((tiredness - 6) * 0.25);

        if (sleepLog.length > 0) {
            const avgQuality = sleepLog.slice(0, 7).reduce((sum, log) => sum + (log.sleepQuality || 5), 0) / Math.min(7, sleepLog.length);
            if (avgQuality < 4) sleepHours += 0.5;
        }

        let bedtimeHour = wakeHour - Math.floor(sleepHours);
        let bedtimeMin = wakeMin - Math.round((sleepHours % 1) * 60);

        if (bedtimeMin < 0) {
            bedtimeMin += 60;
            bedtimeHour -= 1;
        }
        if (bedtimeHour < 0) bedtimeHour += 24;

        let windDownOffset = preferences.relaxationTime;
        if (activities.exercise) windDownOffset += 15;
        if (activities.screenTime) windDownOffset += 20;
        if (activities.heavyMeal) windDownOffset += 15;
        if (activities.alcohol) windDownOffset += 20;

        let windDownHour = bedtimeHour;
        let windDownMin = bedtimeMin - windDownOffset;

        if (windDownMin < 0) {
            windDownMin += 60;
            windDownHour -= 1;
        }
        if (windDownHour < 0) windDownHour += 24;

        const recommendations = [];
        const warnings = [];
        const tips = [];

        if (activities.caffeine) {
            warnings.push('Caffeine blocks adenosine receptors - avoid within 6 hours of bedtime');
        }
        if (activities.alcohol) {
            warnings.push('Alcohol disrupts REM sleep and causes fragmented sleep patterns');
        }
        if (activities.screenTime) {
            warnings.push('Blue light suppresses melatonin production - stop 2 hours before bed');
        }
        if (activities.heavyMeal) {
            warnings.push('Late heavy meals can cause acid reflux and disrupt sleep');
        }
        if (activities.nap && tiredness > 7) {
            warnings.push('Late afternoon naps can make it harder to fall asleep at night');
        }

        if (activities.exercise) {
            recommendations.push('Exercise improves deep sleep - finish 3-4 hours before bed');
        }
        if (activities.reading) {
            recommendations.push('Reading reduces stress by 68% - excellent pre-sleep activity');
        }
        if (activities.shower) {
            recommendations.push('Temperature drop after shower mimics natural sleep onset');
        }
        if (activities.meditation) {
            recommendations.push('Meditation activates the parasympathetic nervous system');
        }

        tips.push('Maintain consistent sleep/wake times, even on weekends');
        tips.push('Keep bedroom temperature between 60-67°F (15-19°C)');
        tips.push('Use blackout curtains or a sleep mask for darkness');
        tips.push('Consider white noise or earplugs for sound control');

        const bedtimeFormatted = `${String(bedtimeHour).padStart(2, '0')}:${String(bedtimeMin).padStart(2, '0')}`;
        const windDownFormatted = `${String(windDownHour).padStart(2, '0')}:${String(windDownMin).padStart(2, '0')}`;

        const calculatedRoutine = {
            bedtime: bedtimeFormatted,
            windDown: windDownFormatted,
            sleepDuration: sleepHours.toFixed(1),
            sleepCycles: calculateSleepCycles(sleepHours),
            recommendations,
            warnings,
            tips,
            timestamp: new Date().toISOString(),
            wakeTime,
            tiredness,
            sleepQuality,
            activities: { ...activities },
            timeline: generateDetailedTimeline(windDownFormatted, bedtimeFormatted, wakeTime, sleepHours)
        };

        setRoutine(calculatedRoutine);
    };

    const logSleep = async () => {
        if (!routine) return;

        const quality = parseInt(prompt('How would you rate your sleep quality? (1-10)', sleepQuality));
        if (!quality || quality < 1 || quality > 10) return;

        const entry = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            dateObj: new Date().toISOString(),
            sleepQuality: quality,
            ...routine
        };

        const updatedLog = [entry, ...sleepLog].slice(0, 30);
        setSleepLog(updatedLog);

        try {
            await window.storage.set('sleep-log', JSON.stringify(updatedLog));
            alert('Sleep routine logged successfully!');
        } catch (error) {
            console.error('Error saving log:', error);
        }
    };

    const saveRoutine = async () => {
        if (!routine) return;

        const name = prompt('Name this routine:');
        if (!name) return;

        const saved = {
            id: Date.now(),
            name,
            wakeTime,
            tiredness,
            sleepQuality,
            activities: { ...activities }
        };

        const updated = [...savedRoutines, saved];
        setSavedRoutines(updated);

        try {
            await window.storage.set('saved-routines', JSON.stringify(updated));
            alert('Routine saved!');
        } catch (error) {
            console.error('Error saving routine:', error);
        }
    };

    const loadSavedRoutine = (saved) => {
        setWakeTime(saved.wakeTime);
        setTiredness(saved.tiredness);
        setSleepQuality(saved.sleepQuality || 5);
        setActivities(saved.activities);
    };

    const deleteRoutine = async (id) => {
        const updated = savedRoutines.filter(r => r.id !== id);
        setSavedRoutines(updated);

        try {
            await window.storage.set('saved-routines', JSON.stringify(updated));
        } catch (error) {
            console.error('Error deleting routine:', error);
        }
    };

    const exportData = () => {
        const data = {
            sleepLog,
            savedRoutines,
            chatMessages,
            preferences,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bedtime-routine-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const sendMessageToAI = async () => {
        if (!chatInput.trim()) return;

        const userMessage = { role: 'user', content: chatInput, timestamp: Date.now() };
        const updatedMessages = [...chatMessages, userMessage];
        setChatMessages(updatedMessages);
        setChatInput('');
        setIsAIThinking(true);

        try {
            const sleepData = {
                recentLogs: sleepLog.slice(0, 7),
                currentTiredness: tiredness,
                currentQuality: sleepQuality,
                activities: activities,
                stats: calculateStats()
            };

            // Check if we're running in the artifact environment (has API access)
            const isArtifactEnvironment = window.location.hostname.includes('claude.ai');

            let aiResponse;

            if (isArtifactEnvironment) {
                // Real API call (only works in claude.ai artifacts)
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 1000,
                        messages: [
                            {
                                role: 'user',
                                content: `You are a sleep coach helping someone improve their sleep. Here's their sleep data: ${JSON.stringify(sleepData)}

User question: ${chatInput}

Provide helpful, science-based advice in a friendly, conversational tone. Keep responses concise (2-3 paragraphs max).`
                            }
                        ]
                    })
                });

                const data = await response.json();
                aiResponse = data.content?.find(c => c.type === 'text')?.text || 'Sorry, I could not process that.';
            } else {
                // Mock AI responses for local development
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay

                aiResponse = generateMockAIResponse(chatInput, sleepData);
            }

            const aiMessage = { role: 'assistant', content: aiResponse, timestamp: Date.now() };
            const finalMessages = [...updatedMessages, aiMessage];
            setChatMessages(finalMessages);

            await window.storage.set('chat-messages', JSON.stringify(finalMessages));
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: Date.now()
            };
            setChatMessages([...updatedMessages, errorMessage]);
        } finally {
            setIsAIThinking(false);
        }
    };

    // Add this helper function to generate intelligent mock responses
    const generateMockAIResponse = (question, sleepData) => {
        const lowerQ = question.toLowerCase();

        // Analyze user's data for personalized responses
        const stats = sleepData.stats;
        const hasLogs = sleepData.recentLogs.length > 0;
        const avgQuality = hasLogs ? stats.avgQuality : sleepData.currentQuality;
        const avgSleep = hasLogs ? parseFloat(stats.avgSleep) : 7.5;
        const badActivities = Object.entries(sleepData.activities)
            .filter(([key, val]) => val && ['caffeine', 'alcohol', 'screenTime', 'heavyMeal'].includes(key))
            .map(([key]) => key);

        // Pattern matching for different question types
        if (lowerQ.includes('tired') || lowerQ.includes('exhausted') || lowerQ.includes('wake up')) {
            if (avgSleep < 7) {
                return `Based on your data, you're averaging ${avgSleep} hours of sleep, which is below the recommended 7-9 hours. Sleep debt accumulates and can leave you feeling tired even if you slept recently.\n\nI'd recommend: (1) Try going to bed 30-60 minutes earlier, (2) Maintain a consistent sleep schedule, even on weekends, (3) Avoid hitting snooze - it fragments your final sleep cycle. Your body needs sustained, quality sleep to feel truly refreshed.`;
            }
            if (badActivities.length > 0) {
                return `Even if you're getting enough hours, quality matters! I notice you're engaging in ${badActivities.join(', ')} before bed. These can significantly impact how rested you feel.\n\nScreen time suppresses melatonin, caffeine blocks adenosine (your sleep chemical), and alcohol disrupts REM sleep. Try eliminating these 2-3 hours before bed and you should notice feeling more refreshed in the morning.`;
            }
            return `Waking up tired can have several causes. Make sure you're: (1) Getting 7-9 hours consistently, (2) Waking up at the end of a sleep cycle (multiples of 90 min), (3) Getting morning sunlight within 30 min of waking to reset your circadian rhythm.\n\nAlso check your sleep environment - room should be cool (60-67°F), completely dark, and quiet. Even small disruptions can affect how rested you feel.`;
        }

        if (lowerQ.includes('fall asleep') || lowerQ.includes('cant sleep') || lowerQ.includes('insomnia')) {
            return `Trouble falling asleep is often related to your pre-bed routine and circadian rhythm. Here's what I recommend:\n\n1. Start wind-down 60-90 minutes before bed - dim lights, no screens, relaxing activities like reading\n2. Keep your bedroom cool (60-67°F) and completely dark\n3. If you can't sleep after 20 minutes, get up and do something calming until you feel sleepy\n4. Avoid caffeine after 2 PM and heavy meals 3 hours before bed\n\nYour body needs consistent cues to know it's sleep time. The routine you follow matters as much as the timing!`;
        }

        if (lowerQ.includes('quality') || lowerQ.includes('improve') || lowerQ.includes('better')) {
            if (hasLogs && avgQuality < 6) {
                return `Your average sleep quality is ${avgQuality}/10, which suggests there's definitely room for improvement. ${badActivities.length > 0 ? `I see you're doing ${badActivities.join(', ')} - these are major sleep disruptors.` : ''}\n\nTop recommendations: (1) Stick to the same sleep/wake time every day (even weekends), (2) Get 30 minutes of morning sunlight, (3) Exercise regularly but not within 3 hours of bed, (4) Create a proper wind-down routine starting 90 minutes before sleep. Focus on consistency - your body loves predictability!`;
            }
            return `To improve sleep quality: (1) Optimize your environment - cool (60-67°F), dark, quiet, (2) Build a consistent pre-bed routine your body recognizes, (3) Avoid screens 2 hours before bed - blue light suppresses melatonin, (4) Try the 10-3-2-1-0 rule: No caffeine 10 hrs before, no food/alcohol 3 hrs before, no work 2 hrs before, no screens 1 hr before, zero times hitting snooze!\n\nSmall consistent changes compound over time. Start with one habit and build from there.`;
        }

        if (lowerQ.includes('analyze') || lowerQ.includes('pattern') || lowerQ.includes('data')) {
            if (!hasLogs) {
                return `I'd love to analyze your patterns, but you haven't logged any sleep data yet! Start logging your sleep for a few days and I'll be able to give you personalized insights about your sleep trends, consistency, and which activities are affecting your rest.\n\nOnce you have some data, I can help identify patterns like whether screen time is hurting your quality, if you're getting enough sleep cycles, and what your optimal bedtime might be.`;
            }
            return `Looking at your sleep data:\n\n• Average sleep: ${avgSleep}h ${avgSleep < 7 ? '(below recommended 7-9h)' : avgSleep > 9 ? '(above typical needs)' : '(good range!)'}\n• Average quality: ${avgQuality}/10 ${avgQuality < 6 ? '(needs improvement)' : avgQuality < 7.5 ? '(decent, room to improve)' : '(great!)'}\n• Consistency: ${stats?.consistency?.toFixed(0) || 'N/A'}% ${stats?.consistency < 70 ? '(try to be more consistent)' : '(good!)'}\n• Sleep debt: ${stats?.sleepDebt || 0}h over last week\n\n${badActivities.length > 0 ? `I notice you're engaging in ${badActivities.join(', ')} - these could be impacting your quality. Consider reducing these activities before bed.` : 'Your evening habits look good! Keep it up.'}\n\nYour biggest opportunity: ${avgSleep < 7 ? 'Increase total sleep time' : avgQuality < 7 ? 'Focus on sleep quality through better habits' : 'Maintain consistency!'}`;
        }

        // Default response
        return `Great question! Sleep is complex and affected by many factors. Based on your profile:\n\nCurrent tiredness: ${sleepData.currentTiredness}/10\nRecent quality: ${avgQuality}/10\n${badActivities.length > 0 ? `Activities to watch: ${badActivities.join(', ')}\n` : ''}\nKey principles: (1) Consistency is crucial - same sleep/wake times daily, (2) Quality over quantity - optimize your environment and habits, (3) Listen to your body - 7-9 hours is typical but individual needs vary.\n\nWhat specific aspect of your sleep would you like to improve? I can give more targeted advice!`;
    };

    const calculateStats = () => {
        if (sleepLog.length === 0) return null;

        const recent = sleepLog.slice(0, 7);
        const avgSleep = recent.reduce((sum, log) => sum + parseFloat(log.sleepDuration), 0) / recent.length;
        const avgTiredness = recent.reduce((sum, log) => sum + log.tiredness, 0) / recent.length;
        const avgQuality = recent.reduce((sum, log) => sum + (log.sleepQuality || 5), 0) / recent.length;

        const targetSleep = 8;
        const sleepDebt = recent.reduce((debt, log) => debt + (targetSleep - parseFloat(log.sleepDuration)), 0);

        const consistency = calculateConsistency();

        return {
            avgSleep: avgSleep.toFixed(1),
            avgTiredness: avgTiredness.toFixed(1),
            avgQuality: avgQuality.toFixed(1),
            totalEntries: sleepLog.length,
            sleepDebt: sleepDebt.toFixed(1),
            consistency
        };
    };

    const calculateConsistency = () => {
        if (sleepLog.length < 3) return 0;
        const recent = sleepLog.slice(0, 7);
        const times = recent.map(log => {
            const [h, m] = log.bedtime.split(':').map(Number);
            return h * 60 + m;
        });
        const avg = times.reduce((a, b) => a + b) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
        const stdDev = Math.sqrt(variance);
        return Math.max(0, Math.min(100, 100 - stdDev / 2));
    };

    const prepareChartData = () => {
        if (sleepLog.length === 0) return { sleepTrend: [], qualityTrend: [], activityComparison: [] };

        const sortedLogs = [...sleepLog].sort((a, b) => new Date(a.dateObj) - new Date(b.dateObj)).slice(-14);

        const sleepTrend = sortedLogs.map(log => ({
            date: new Date(log.dateObj).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hours: parseFloat(log.sleepDuration),
            quality: log.sleepQuality,
            tiredness: log.tiredness
        }));

        const qualityTrend = sortedLogs.map(log => ({
            date: new Date(log.dateObj).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            quality: log.sleepQuality,
            target: 7
        }));

        const activityCounts = {};
        const activityQuality = {};

        sleepLog.forEach(log => {
            Object.entries(log.activities).forEach(([key, value]) => {
                if (value) {
                    activityCounts[key] = (activityCounts[key] || 0) + 1;
                    activityQuality[key] = (activityQuality[key] || []).concat(log.sleepQuality);
                }
            });
        });

        const activityComparison = Object.entries(activityCounts).map(([activity, count]) => ({
            activity: activity.replace(/([A-Z])/g, ' $1').trim(),
            frequency: count,
            avgQuality: parseFloat((activityQuality[activity].reduce((a, b) => a + b, 0) / activityQuality[activity].length).toFixed(1))
        }));

        return { sleepTrend, qualityTrend, activityComparison };
    };

    const toggleActivity = (activity) => {
        setActivities(prev => ({ ...prev, [activity]: !prev[activity] }));
    };

    const activityOptions = [
        { key: 'exercise', label: 'Exercise', icon: Dumbbell, impact: 'positive' },
        { key: 'screenTime', label: 'Screen Time', icon: Tv, impact: 'negative' },
        { key: 'reading', label: 'Reading', icon: Book, impact: 'positive' },
        { key: 'heavyMeal', label: 'Heavy Meal', icon: Coffee, impact: 'negative' },
        { key: 'caffeine', label: 'Caffeine', icon: Coffee, impact: 'negative' },
        { key: 'shower', label: 'Shower/Bath', icon: Bath, impact: 'positive' },
        { key: 'meditation', label: 'Meditation', icon: Brain, impact: 'positive' },
        { key: 'alcohol', label: 'Alcohol', icon: Droplets, impact: 'negative' },
        { key: 'nap', label: 'Late Nap', icon: Moon, impact: 'neutral' }
    ];

    const stats = calculateStats();
    const chartData = prepareChartData();

    const getPhaseColor = (phase) => {
        switch (phase) {
            case 'preparation': return 'from-orange-500/30 to-orange-600/30 border-orange-400/50';
            case 'winddown': return 'from-blue-500/30 to-blue-600/30 border-blue-400/50';
            case 'sleep': return 'from-purple-500/30 to-purple-600/30 border-purple-400/50';
            case 'wake': return 'from-yellow-500/30 to-yellow-600/30 border-yellow-400/50';
            default: return 'from-gray-500/30 to-gray-600/30 border-gray-400/50';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Moon className="w-12 h-12 text-yellow-300" />
                        <h1 className="text-4xl md:text-5xl font-bold text-white">Advanced Sleep Planner</h1>
                    </div>
                    <p className="text-purple-200 text-lg">Science-based sleep optimization with AI coach & analytics</p>
                    <p className="text-purple-100 text-lg">Created By: Jason Shi</p>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all border border-white/20"
                        >
                            <BarChart3 className="w-4 h-4" />
                            {showStats ? 'Hide Stats' : 'View Stats'}
                        </button>
                        <button
                            onClick={() => setShowCharts(!showCharts)}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all border border-white/20"
                        >
                            <TrendingUp className="w-4 h-4" />
                            {showCharts ? 'Hide Charts' : 'View Charts'}
                        </button>
                        <button
                            onClick={() => setShowAICoach(!showAICoach)}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all border border-purple-300"
                        >
                            <MessageCircle className="w-4 h-4" />
                            AI Sleep Coach
                        </button>
                        <button
                            onClick={exportData}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all border border-white/20"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {showAICoach && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                                <Brain className="w-6 h-6" />
                                AI Sleep Coach
                            </h2>
                            <button onClick={() => setShowAICoach(false)} className="text-white/60 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-purple-200 py-8">
                                    <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                                    <p className="mb-2">Hi! I'm your AI sleep coach powered by Claude.</p>
                                    <p className="text-sm">Ask me anything about your sleep patterns, habits, or how to improve your rest!</p>
                                    <div className="mt-4 text-left max-w-md mx-auto space-y-2">
                                        <p className="text-xs text-purple-300">Try asking:</p>
                                        <ul className="text-xs space-y-1">
                                            <li>• "Why do I wake up tired?"</li>
                                            <li>• "How can I fall asleep faster?"</li>
                                            <li>• "What's affecting my sleep quality?"</li>
                                            <li>• "Analyze my sleep patterns"</li>
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                                    ? 'bg-purple-500 text-white'
                                                    : 'bg-white/10 text-purple-100'
                                                }`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {isAIThinking && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 text-purple-100 p-3 rounded-lg">
                                                <p className="text-sm">Analyzing your sleep data...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessageToAI()}
                                placeholder="Ask me about your sleep..."
                                className="flex-1 p-3 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isAIThinking}
                            />
                            <button
                                onClick={sendMessageToAI}
                                disabled={isAIThinking || !chatInput.trim()}
                                className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {showCharts && sleepLog.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" />
                            Sleep Analytics Dashboard
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white/5 p-4 rounded-lg">
                                <h3 className="text-white font-semibold mb-4">Sleep Duration Trend (Last 14 Days)</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={chartData.sleepTrend}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                        <XAxis dataKey="date" stroke="#fff" style={{ fontSize: '12px' }} />
                                        <YAxis stroke="#fff" style={{ fontSize: '12px' }} domain={[0, 12]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="hours" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHours)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white/5 p-4 rounded-lg">
                                <h3 className="text-white font-semibold mb-4">Sleep Quality Over Time</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={chartData.qualityTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                        <XAxis dataKey="date" stroke="#fff" style={{ fontSize: '12px' }} />
                                        <YAxis stroke="#fff" style={{ fontSize: '12px' }} domain={[0, 10]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="quality" stroke="#10b981" strokeWidth={2} name="Quality" />
                                        <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {chartData.activityComparison.length > 0 && (
                                <div className="bg-white/5 p-4 rounded-lg md:col-span-2">
                                    <h3 className="text-white font-semibold mb-4">Activity Impact on Sleep Quality</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData.activityComparison}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                                            <XAxis dataKey="activity" stroke="#fff" style={{ fontSize: '12px' }} />
                                            <YAxis stroke="#fff" style={{ fontSize: '12px' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                                labelStyle={{ color: '#fff' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="frequency" fill="#8b5cf6" name="Frequency" />
                                            <Bar dataKey="avgQuality" fill="#10b981" name="Avg Quality" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showStats && stats && (
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6" />
                            Your Sleep Analytics (Last 7 Days)
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Avg Sleep</div>
                                <div className="text-2xl font-bold text-white">{stats.avgSleep}h</div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Avg Quality</div>
                                <div className="text-2xl font-bold text-white">{stats.avgQuality}/10</div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Consistency</div>
                                <div className="text-2xl font-bold text-white">{stats.consistency.toFixed(0)}%</div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Sleep Debt</div>
                                <div className="text-2xl font-bold text-white">{stats.sleepDebt}h</div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Total Logs</div>
                                <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
                            </div>
                            <div className="bg-white/10 p-4 rounded-lg">
                                <div className="text-purple-200 text-sm">Avg Tiredness</div>
                                <div className="text-2xl font-bold text-white">{stats.avgTiredness}/10</div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20">
                            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                                <Sun className="w-6 h-6" />
                                Sleep Profile
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Wake-up Time
                                    </label>
                                    <input
                                        type="time"
                                        value={wakeTime}
                                        onChange={(e) => setWakeTime(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Current Tiredness Level ({tiredness}/10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={tiredness}
                                        onChange={(e) => setTiredness(Number(e.target.value))}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #60a5fa ${(tiredness - 1) * 11.11}%, rgba(255,255,255,0.2) ${(tiredness - 1) * 11.11}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-sm text-purple-200 mt-1">
                                        <span>Alert</span>
                                        <span>Exhausted</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2 flex items-center gap-2">
                                        <Heart className="w-5 h-5" />
                                        Recent Sleep Quality ({sleepQuality}/10)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={sleepQuality}
                                        onChange={(e) => setSleepQuality(Number(e.target.value))}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #34d399 ${(sleepQuality - 1) * 11.11}%, rgba(255,255,255,0.2) ${(sleepQuality - 1) * 11.11}%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-sm text-purple-200 mt-1">
                                        <span>Poor</span>
                                        <span>Excellent</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-3">
                                        Evening Activities (select all that apply):
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {activityOptions.map(({ key, label, icon: Icon, impact }) => (
                                            <button
                                                key={key}
                                                onClick={() => toggleActivity(key)}
                                                className={`p-3 rounded-lg border-2 transition-all ${activities[key]
                                                        ? impact === 'positive'
                                                            ? 'bg-green-500/80 border-green-300 text-white'
                                                            : impact === 'negative'
                                                                ? 'bg-red-500/80 border-red-300 text-white'
                                                                : 'bg-blue-500/80 border-blue-300 text-white'
                                                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-xs font-medium block">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={calculateRoutine}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-5 h-5" />
                                    Generate Optimized Routine
                                </button>
                            </div>
                        </div>

                        {routine && (
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold text-white">Your Personalized Routine</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={logSleep}
                                            className="flex items-center gap-2 bg-green-500/80 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            Log
                                        </button>
                                        <button
                                            onClick={saveRoutine}
                                            className="flex items-center gap-2 bg-blue-500/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-4 rounded-xl border border-blue-400/50">
                                        <div className="text-blue-200 text-xs mb-1">Wind-Down</div>
                                        <div className="text-2xl font-bold text-white">{routine.windDown}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500/30 to-purple-600/30 p-4 rounded-xl border border-purple-400/50">
                                        <div className="text-purple-200 text-xs mb-1">Lights Out</div>
                                        <div className="text-2xl font-bold text-white">{routine.bedtime}</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-500/30 to-pink-600/30 p-4 rounded-xl border border-pink-400/50">
                                        <div className="text-pink-200 text-xs mb-1">Sleep Time</div>
                                        <div className="text-2xl font-bold text-white">{routine.sleepDuration}h</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500/30 to-green-600/30 p-4 rounded-xl border border-green-400/50">
                                        <div className="text-green-200 text-xs mb-1">Sleep Cycles</div>
                                        <div className="text-2xl font-bold text-white">{routine.sleepCycles}</div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <button
                                        onClick={() => setShowTimeline(!showTimeline)}
                                        className="w-full flex items-center justify-between text-white font-semibold mb-4 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Clock className="w-5 h-5" />
                                            Detailed Timeline
                                        </span>
                                        {showTimeline ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>

                                    {showTimeline && (
                                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                            {routine.timeline.map((item, idx) => {
                                                const Icon = item.icon;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`flex gap-4 items-start p-4 rounded-lg border transition-all ${item.important
                                                                ? 'bg-gradient-to-r ' + getPhaseColor(item.phase) + ' ring-2 ring-white/50'
                                                                : 'bg-white/5 border-white/20'
                                                            } ${item.cycle ? 'opacity-70' : ''}`}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.important ? 'bg-white/30' : 'bg-white/10'
                                                                }`}>
                                                                <Icon className="w-6 h-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-white font-bold text-lg">{item.time}</span>
                                                                {item.important && (
                                                                    <span className="px-2 py-0.5 bg-yellow-400/30 text-yellow-100 text-xs rounded-full font-semibold">
                                                                        KEY TIME
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-white font-semibold mb-1">{item.title}</div>
                                                            <div className="text-purple-200 text-sm">{item.description}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {routine.warnings.length > 0 && (
                                    <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6">
                                        <h3 className="text-red-200 font-semibold mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5" />
                                            Important Considerations
                                        </h3>
                                        <ul className="space-y-2">
                                            {routine.warnings.map((warning, idx) => (
                                                <li key={idx} className="text-red-100 text-sm flex items-start gap-2">
                                                    <span className="text-red-300 mt-1">•</span>
                                                    <span>{warning}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {routine.recommendations.length > 0 && (
                                    <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-4 mb-4">
                                        <h3 className="text-green-200 font-semibold mb-3">Recommendations</h3>
                                        <ul className="space-y-2">
                                            {routine.recommendations.map((rec, idx) => (
                                                <li key={idx} className="text-green-100 text-sm flex items-start gap-2">
                                                    <span className="text-green-300 mt-1">✓</span>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="bg-blue-500/20 border border-blue-400/50 rounded-xl p-4">
                                    <h3 className="text-blue-200 font-semibold mb-3">Sleep Science Tips</h3>
                                    <ul className="space-y-2">
                                        {routine.tips.map((tip, idx) => (
                                            <li key={idx} className="text-blue-100 text-sm flex items-start gap-2">
                                                <Zap className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Save className="w-5 h-5" />
                                Saved Routines
                            </h3>
                            {savedRoutines.length === 0 ? (
                                <p className="text-purple-200 text-sm">No saved routines yet</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {savedRoutines.map((saved) => (
                                        <div key={saved.id} className="bg-white/10 p-3 rounded-lg flex justify-between items-center hover:bg-white/20 transition-all">
                                            <button
                                                onClick={() => loadSavedRoutine(saved)}
                                                className="text-white text-sm font-medium hover:text-purple-300 flex-1 text-left"
                                            >
                                                {saved.name}
                                            </button>
                                            <button
                                                onClick={() => deleteRoutine(saved.id)}
                                                className="text-red-300 hover:text-red-400 ml-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Recent History
                            </h3>
                            {sleepLog.length === 0 ? (
                                <p className="text-purple-200 text-sm">No logged routines yet</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {sleepLog.slice(0, 10).map((log) => (
                                        <div key={log.id} className="bg-white/10 p-3 rounded-lg hover:bg-white/20 transition-all">
                                            <div className="text-white font-medium text-sm flex items-center justify-between">
                                                <span>{log.date}</span>
                                                <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded">
                                                    Q: {log.sleepQuality}/10
                                                </span>
                                            </div>
                                            <div className="text-purple-200 text-xs mt-1">
                                                {log.sleepDuration}h sleep • {log.sleepCycles} cycles
                                            </div>
                                            <div className="text-purple-300 text-xs mt-1">
                                                Tiredness: {log.tiredness}/10
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {routine && (
                            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-lg rounded-2xl p-6 border border-indigo-400/50">
                                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                    <Brain className="w-5 h-5" />
                                    Sleep Science
                                </h3>
                                <div className="space-y-3 text-sm text-purple-100">
                                    <div className="flex items-start gap-2">
                                        <Zap className="w-4 h-4 text-yellow-300 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-semibold text-white">Sleep Cycles</div>
                                            <div className="text-xs">Each 90-min cycle includes light, deep, and REM sleep</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Moon className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-semibold text-white">Melatonin</div>
                                            <div className="text-xs">Naturally rises 2 hours before sleep onset</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Heart className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-semibold text-white">Body Temperature</div>
                                            <div className="text-xs">Drops 1-2°F during sleep - cool room helps</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}