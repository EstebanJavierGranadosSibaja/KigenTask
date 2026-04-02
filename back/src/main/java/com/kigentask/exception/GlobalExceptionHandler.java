package com.kigentask.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.stream.Collectors;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(NotFoundException.class)
        public ResponseEntity<ErrorResponse> handleNotFoundException(NotFoundException ex, HttpServletRequest request) {
                return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
        }

        @ExceptionHandler(ConflictException.class)
        public ResponseEntity<ErrorResponse> handleConflictException(ConflictException ex, HttpServletRequest request) {
                return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
        }

        @ExceptionHandler(DataIntegrityViolationException.class)
        public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
                        DataIntegrityViolationException ex,
                        HttpServletRequest request
        ) {
                return buildResponse(HttpStatus.CONFLICT, "Request violates a database constraint", request);
        }

        @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
        public ResponseEntity<ErrorResponse> handleForbiddenException(Exception ex, HttpServletRequest request) {
                return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
        }

        @ExceptionHandler({UnauthorizedException.class, BadCredentialsException.class, AuthenticationException.class})
        public ResponseEntity<ErrorResponse> handleUnauthorizedException(Exception ex, HttpServletRequest request) {
                return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
        }

        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest request) {
                return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
        }

        @ExceptionHandler(MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
                        MethodArgumentTypeMismatchException ex,
                        HttpServletRequest request
        ) {
                String parameter = ex.getName() == null || ex.getName().isBlank()
                                ? "request parameter"
                                : ex.getName();
                return buildResponse(HttpStatus.BAD_REQUEST, "Invalid value for parameter " + parameter, request);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponse> handleMalformedRequestBody(
                        HttpMessageNotReadableException ex,
                        HttpServletRequest request
        ) {
                return buildResponse(HttpStatus.BAD_REQUEST, "Malformed JSON request body", request);
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<ErrorResponse> handleConstraintViolation(
                        ConstraintViolationException ex,
                        HttpServletRequest request
        ) {
                String message = ex.getConstraintViolations().stream()
                                .map(violation -> {
                                        String path = violation.getPropertyPath() == null
                                                        ? "value"
                                                        : violation.getPropertyPath().toString();
                                        int lastDot = path.lastIndexOf('.');
                                        String field = lastDot >= 0 ? path.substring(lastDot + 1) : path;
                                        return field + ": " + violation.getMessage();
                                })
                                .collect(Collectors.joining(", "));

                if (message.isBlank()) {
                        message = "Validation failed";
                }

                return buildResponse(HttpStatus.BAD_REQUEST, message, request);
        }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(
            Exception ex,
            HttpServletRequest request
    ) {
                LOGGER.error("Unhandled exception at {}", request.getRequestURI(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    private String formatFieldError(FieldError error) {
        String defaultMessage = error.getDefaultMessage() == null ? "invalid value" : error.getDefaultMessage();
        return error.getField() + ": " + defaultMessage;
    }

        private ResponseEntity<ErrorResponse> buildResponse(
                        HttpStatus status,
                        String message,
                        HttpServletRequest request
        ) {
                ErrorResponse response = new ErrorResponse(
                                Instant.now(),
                                status.value(),
                                status.getReasonPhrase(),
                                message,
                                request.getRequestURI()
                );
                return ResponseEntity.status(status).body(response);
        }
}