import { expect, test } from '@playwright/test';

test.describe('AttendLink Attendance E2E Journey', () => {
	const timestamp = Date.now();
	const facultyEmail = `faculty-${timestamp}@university.edu`;
	const studentEmail = `student-${timestamp}@university.edu`;
	const classCode = `CS-${timestamp.toString().slice(-4)}`;
	const className = `E2E Network Architecture ${timestamp}`;

	test('should complete the entire faculty class creation and student QR check-in flow', async ({
		page,
		browser
	}) => {
		page.on('console', (msg) => console.log('FACULTY PAGE LOG:', msg.text()));
		page.on('pageerror', (err) => console.error('FACULTY PAGE ERROR:', err.message));

		// 1. REGISTER FACULTY
		await page.goto('/auth');
		await page.click('text=Register');

		await page.fill('#firstName', 'Professor');
		await page.fill('#lastName', 'Newton');
		await page.click('text=Faculty'); // Select role
		await page.fill('#email', facultyEmail);
		await page.fill('#password', 'FacultyPassword123');
		await page.click('button[type="submit"]');

		// Verify redirected to Faculty Dashboard
		try {
			await expect(page).toHaveURL(/\/dashboard\/faculty/);
		} catch (e) {
			console.log('HTML CONTENT ON FAILURE:', await page.content());
			throw e;
		}
		await expect(page.locator('h1:has-text("Classes")')).toBeVisible();

		// 2. CREATE A CLASS AS FACULTY
		await page.click('text=Create Class');
		await page.fill('#classCode', classCode);
		await page.fill('#className', className);
		await page.fill('#classDesc', 'This is an E2E test course for networking protocols.');
		await page.click('button[type="submit"]:has-text("Create")');

		// Verify class shows in list
		await expect(page.locator(`text=${classCode}`)).toBeVisible();

		// Click class to load details
		await page.click(`text=${classCode}`);
		await expect(page.locator('h3:has-text("Sessions")')).toBeVisible();

		// 3. CREATE A CLASS SESSION
		await page.click('text=New Session');
		await page.click('button[type="submit"]:has-text("Create Session")');

		// Select the newly created session
		await page.click('button:has-text("2026")'); // Clicks the session card in the list

		// Start attendance session
		await page.click('button:has-text("Start Attendance")');

		// Check that the Stop Session button is present (meaning attendance is active)
		await expect(page.locator('button:has-text("Stop Session")')).toBeVisible();

		// Wait for QR code image to appear
		const qrImg = page.locator('img[alt="Session QR Check-in"]');
		await expect(qrImg).toBeVisible();

		// Extract the check-in URL from the QR Code API image src
		const qrSrc = await qrImg.getAttribute('src');
		expect(qrSrc).not.toBeNull();

		const qrUrlParams = new URL(qrSrc!);
		const dataUrlString = qrUrlParams.searchParams.get('data');
		expect(dataUrlString).not.toBeNull();

		// Convert extracted check-in URL to a path relative to the test browser
		const checkInUrl = new URL(dataUrlString!);
		const relativeCheckInPath = checkInUrl.pathname + checkInUrl.search;

		// 4. REGISTER STUDENT (In a separate browser context/session to mimic student device)
		const studentContext = await browser.newContext();
		const studentPage = await studentContext.newPage();
		studentPage.on('console', (msg) => console.log('STUDENT PAGE LOG:', msg.text()));
		studentPage.on('pageerror', (err) => console.error('STUDENT PAGE ERROR:', err.message));

		await studentPage.goto('/auth');
		await studentPage.click('text=Register');

		await studentPage.fill('#firstName', 'Alice');
		await studentPage.fill('#lastName', 'Smith');
		await studentPage.click('text=Student'); // Select role
		await studentPage.fill('#email', studentEmail);
		await studentPage.fill('#password', 'StudentPassword123');
		await studentPage.click('button[type="submit"]');

		// Verify redirected to Student Dashboard
		await expect(studentPage).toHaveURL(/\/dashboard\/student/);

		// 5. ENROLL STUDENT IN CLASS
		await studentPage.click('text=Enroll in Class');
		await studentPage.fill('#enrollCode', classCode);
		await studentPage.click('button[type="submit"]:has-text("Enroll")');

		// Verify class shows on Student's dashboard
		await expect(studentPage.locator(`text=${classCode}`)).toBeVisible();

		// 6. STUDENT SIMULATES QR CODE SCAN
		// Navigate to the check-in path extracted from the QR code
		await studentPage.goto(relativeCheckInPath);

		// Verify redirected to completed page
		await expect(studentPage).toHaveURL(/\/dashboard\/student\/completed/);
		await expect(studentPage.locator('h1')).toContainText('Attendance');
		await expect(studentPage.locator('h1')).toContainText('Completed');
		await expect(studentPage.locator(`text=${className}`)).toBeVisible();

		// 7. VERIFY ON FACULTY DASHBOARD THAT STUDENT IS MARKED PRESENT
		await page.reload();
		await page.click(`text=${classCode}`);
		await page.click('button:has-text("2026")'); // select session
		await expect(page.locator('text=Checked In (1/1)')).toBeVisible();
		await expect(page.locator('text=Alice Smith')).toBeVisible();
		await expect(page.locator('span:has-text("present")')).toBeVisible();
		await studentContext.close();
	});
});
