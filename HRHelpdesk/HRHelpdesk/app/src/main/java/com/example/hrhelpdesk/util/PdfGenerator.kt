package com.example.hrhelpdesk.util

import android.content.Context
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import com.example.hrhelpdesk.data.Employee
import com.example.hrhelpdesk.data.Payroll
import java.io.File
import java.io.FileOutputStream
import java.text.NumberFormat
import java.util.Locale

object PdfGenerator {

    fun generatePdf(context: Context, payroll: Payroll, employee: Employee): File? {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4 size
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        val titlePaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 24f
            color = 0xFF000000.toInt() // Black
            textAlign = Paint.Align.CENTER
        }

        val headerPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textSize = 16f
            color = 0xFF000000.toInt() // Black
        }

        val textPaint = Paint().apply {
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            textSize = 14f
            color = 0xFF333333.toInt() // Dark Gray
        }

        val currencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

        var yPos = 60f
        canvas.drawText("Payslip", pageInfo.pageWidth / 2f, yPos, titlePaint)

        yPos += 50f
        canvas.drawText("Employee Details", 40f, yPos, headerPaint)
        yPos += 25f
        canvas.drawText("Name: ${employee.name}", 40f, yPos, textPaint)
        yPos += 20f
        canvas.drawText("Employee ID: ${employee.employeeId}", 40f, yPos, textPaint)

        yPos += 40f
        val monthNames = arrayOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
        canvas.drawText("Pay Period: ${monthNames[payroll.month - 1]} ${payroll.year}", 40f, yPos, headerPaint)

        yPos += 50f
        // Earnings
        canvas.drawText("Earnings", 40f, yPos, headerPaint)
        yPos += 25f
        canvas.drawText("Basic Salary:", 40f, yPos, textPaint)
        canvas.drawText(currencyFormat.format(payroll.basicSalary), 555f, yPos, textPaint.apply{textAlign=Paint.Align.RIGHT})
        yPos += 20f
        canvas.drawText("Allowances:", 40f, yPos, textPaint)
        canvas.drawText(currencyFormat.format(payroll.allowances), 555f, yPos, textPaint.apply{textAlign=Paint.Align.RIGHT})

        yPos += 40f
        // Deductions
        canvas.drawText("Deductions", 40f, yPos, headerPaint)
        yPos += 25f
        canvas.drawText("TDS:", 40f, yPos, textPaint)
        canvas.drawText(currencyFormat.format(payroll.deductions), 555f, yPos, textPaint.apply{textAlign=Paint.Align.RIGHT})


        yPos += 50f
        // Net Pay
        canvas.drawText("Net Salary:", 40f, yPos, headerPaint)
        canvas.drawText(currencyFormat.format(payroll.netSalary), 555f, yPos, headerPaint.apply{textAlign=Paint.Align.RIGHT})


        pdfDocument.finishPage(page)

        try {
            val file = File(context.getExternalFilesDir(null), "Payslip-${monthNames[payroll.month - 1]}-${payroll.year}.pdf")
            val fos = FileOutputStream(file)
            pdfDocument.writeTo(fos)
            pdfDocument.close()
            fos.close()
            return file
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
