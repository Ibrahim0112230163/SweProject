import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import path from 'path';

const execAsync = promisify(exec);

export async function GET() {
    try {
        // Path to the Python script
        const scriptPath = path.join(process.cwd(), 'python', 'skill_trends.py');

        // Execute the Python script
        const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, {
            cwd: process.cwd(),
            timeout: 30000, // 30 second timeout
        });

        if (stderr && !stderr.includes('Warning')) {
            console.error('Python script error:', stderr);
        }

        // Parse the JSON output
        const data = JSON.parse(stdout);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error executing skill trends script:', error);

        // Return fallback data if script fails
        return NextResponse.json({
            skills: [
                { name: "Python", demand: 85 },
                { name: "SQL", demand: 78 },
                { name: "Machine Learning", demand: 72 },
                { name: "Cloud Computing", demand: 65 },
                { name: "React", demand: 60 }
            ]
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=300',
            },
        });
    }
}
