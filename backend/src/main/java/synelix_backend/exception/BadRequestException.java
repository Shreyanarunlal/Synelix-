package synelix_backend.exception;

/** Thrown for invalid input that validation annotations cannot express; mapped to HTTP 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
