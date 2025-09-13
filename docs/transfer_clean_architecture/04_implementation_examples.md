# 実装例とコードサンプル

## Domain Layer の実装例

### Book Entity

```typescript
// src/domain/entities/book.entity.ts
import { BookId } from '../value-objects/book-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { BookStatus } from '../value-objects/book-status.vo';
import { Rating } from '../value-objects/rating.vo';
import { Progress } from '../value-objects/progress.vo';
import { InvalidStatusTransitionError, BookCannotBeRatedError } from '../errors/book.errors';

export class Book {
  private constructor(
    private readonly _id: BookId,
    private readonly _userId: UserId,
    private readonly _title: string,
    private readonly _author: string,
    private _status: BookStatus,
    private readonly _totalPages?: number,
    private _currentPage?: number,
    private _rating?: Rating,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // Factory Methods
  static create(params: {
    title: string;
    author: string;
    userId: UserId;
    totalPages?: number;
    googleBooksId?: string;
  }): Book {
    return new Book(
      BookId.generate(),
      params.userId,
      params.title,
      params.author,
      BookStatus.WANT_TO_READ,
      params.totalPages
    );
  }

  static reconstitute(params: {
    id: BookId;
    userId: UserId;
    title: string;
    author: string;
    status: BookStatus;
    totalPages?: number;
    currentPage?: number;
    rating?: Rating;
    createdAt: Date;
    updatedAt: Date;
  }): Book {
    return new Book(
      params.id,
      params.userId,
      params.title,
      params.author,
      params.status,
      params.totalPages,
      params.currentPage,
      params.rating,
      params.createdAt,
      params.updatedAt
    );
  }

  // Getters
  get id(): BookId { return this._id; }
  get userId(): UserId { return this._userId; }
  get title(): string { return this._title; }
  get author(): string { return this._author; }
  get status(): BookStatus { return this._status; }
  get totalPages(): number | undefined { return this._totalPages; }
  get currentPage(): number | undefined { return this._currentPage; }
  get rating(): Rating | undefined { return this._rating; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  // Business Logic Methods
  updateStatus(newStatus: BookStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(this._status, newStatus);
    }
    this._status = newStatus;
    this._updatedAt = new Date();
  }

  updateProgress(currentPage: number): Progress {
    if (!this._totalPages) {
      throw new Error('Cannot update progress for book without total pages');
    }
    
    if (currentPage < 0 || currentPage > this._totalPages) {
      throw new Error('Invalid page number');
    }

    this._currentPage = currentPage;
    this._updatedAt = new Date();

    // 自動的にステータスを更新
    if (currentPage === this._totalPages && this._status !== BookStatus.COMPLETED) {
      this.updateStatus(BookStatus.COMPLETED);
    } else if (currentPage > 0 && this._status === BookStatus.WANT_TO_READ) {
      this.updateStatus(BookStatus.READING);
    }

    return Progress.create(currentPage, this._totalPages);
  }

  rate(rating: Rating): void {
    if (!this.canBeRated()) {
      throw new BookCannotBeRatedError(this._status);
    }
    this._rating = rating;
    this._updatedAt = new Date();
  }

  isSameBook(other: Book): boolean {
    return this._title.toLowerCase().trim() === other._title.toLowerCase().trim() &&
           this._author.toLowerCase().trim() === other._author.toLowerCase().trim();
  }

  getProgress(): Progress | null {
    if (!this._totalPages || this._currentPage === undefined) {
      return null;
    }
    return Progress.create(this._currentPage, this._totalPages);
  }

  // Private Methods
  private canTransitionTo(newStatus: BookStatus): boolean {
    const allowedTransitions = {
      [BookStatus.WANT_TO_READ]: [BookStatus.READING, BookStatus.DNF],
      [BookStatus.READING]: [BookStatus.COMPLETED, BookStatus.DNF, BookStatus.PAUSED],
      [BookStatus.PAUSED]: [BookStatus.READING, BookStatus.DNF],
      [BookStatus.COMPLETED]: [BookStatus.READING], // 再読
      [BookStatus.DNF]: [BookStatus.READING]
    };
    return allowedTransitions[this._status]?.includes(newStatus) ?? false;
  }

  private canBeRated(): boolean {
    return this._status === BookStatus.COMPLETED;
  }
}
```

### Value Objects

```typescript
// src/domain/value-objects/book-id.vo.ts
import { v4 as uuidv4 } from 'uuid';

export class BookId {
  private constructor(private readonly value: string) {
    if (!BookId.isValid(value)) {
      throw new Error(`Invalid BookId: ${value}`);
    }
  }

  static create(value: string): BookId {
    return new BookId(value);
  }

  static generate(): BookId {
    return new BookId(uuidv4());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: BookId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static isValid(value: string): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}

// src/domain/value-objects/rating.vo.ts
export class Rating {
  private constructor(private readonly value: number) {
    if (!Rating.isValid(value)) {
      throw new Error(`Invalid rating: ${value}`);
    }
  }

  static create(value: number): Rating {
    return new Rating(value);
  }

  getValue(): number {
    return this.value;
  }

  isHighRating(): boolean {
    return this.value >= 4;
  }

  equals(other: Rating): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  private static isValid(value: number): boolean {
    return Number.isInteger(value) && value >= 1 && value <= 5;
  }
}

// src/domain/value-objects/book-status.vo.ts
export enum BookStatus {
  WANT_TO_READ = 'WANT_TO_READ',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  DNF = 'DNF' // Did Not Finish
}
```

## Application Layer の実装例

### Use Case

```typescript
// src/application/use-cases/book/add-book-to-library.use-case.ts
import { Book } from '@/domain/entities/book.entity';
import { BookRepository } from '@/domain/repositories/book.repository';
import { UserRepository } from '@/domain/repositories/user.repository';
import { GoogleBooksService } from '@/application/ports/services/google-books.service';
import { AddBookCommand } from '@/application/dto/commands/add-book.command';
import { AddBookResult } from '@/application/dto/results/add-book.result';
import { UserNotFoundError } from '@/domain/errors/user.errors';
import { DuplicateBookError } from '@/domain/errors/book.errors';

export class AddBookToLibraryUseCase {
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly userRepository: UserRepository,
    private readonly googleBooksService: GoogleBooksService
  ) {}

  async execute(command: AddBookCommand): Promise<AddBookResult> {
    // 1. ユーザー存在確認
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    // 2. 重複チェック
    const existingBooks = await this.bookRepository.findByUserId(command.userId);
    const isDuplicate = existingBooks.some(book => 
      book.title.toLowerCase() === command.bookData.title.toLowerCase() &&
      book.author.toLowerCase() === command.bookData.author.toLowerCase()
    );
    
    if (isDuplicate) {
      throw new DuplicateBookError(command.bookData.title);
    }

    // 3. 外部API からのデータ補完（オプション）
    let enrichedBookData = command.bookData;
    if (command.googleBooksId) {
      try {
        const googleBookData = await this.googleBooksService.getBookById(command.googleBooksId);
        enrichedBookData = {
          ...command.bookData,
          totalPages: googleBookData.totalPages || command.bookData.totalPages,
          isbn: googleBookData.isbn,
          publishedDate: googleBookData.publishedDate,
          imageUrl: googleBookData.imageUrl
        };
      } catch (error) {
        // 外部APIエラーは無視して続行
        console.warn('Failed to fetch Google Books data:', error);
      }
    }

    // 4. ドメインエンティティ作成
    const book = Book.create({
      title: enrichedBookData.title,
      author: enrichedBookData.author,
      userId: command.userId,
      totalPages: enrichedBookData.totalPages,
      googleBooksId: command.googleBooksId
    });

    // 5. 永続化
    const savedBook = await this.bookRepository.save(book);

    return AddBookResult.success(savedBook);
  }
}
```

### Command と Result

```typescript
// src/application/dto/commands/add-book.command.ts
import { UserId } from '@/domain/value-objects/user-id.vo';

export interface BookData {
  title: string;
  author: string;
  totalPages?: number;
  isbn?: string;
  publishedDate?: Date;
  imageUrl?: string;
}

export class AddBookCommand {
  constructor(
    public readonly userId: UserId,
    public readonly bookData: BookData,
    public readonly googleBooksId?: string
  ) {}
}

// src/application/dto/results/add-book.result.ts
import { Book } from '@/domain/entities/book.entity';

export class AddBookResult {
  private constructor(
    public readonly success: boolean,
    public readonly book?: Book,
    public readonly error?: string
  ) {}

  static success(book: Book): AddBookResult {
    return new AddBookResult(true, book);
  }

  static failure(error: string): AddBookResult {
    return new AddBookResult(false, undefined, error);
  }
}
```

## Infrastructure Layer の実装例

### Repository Implementation

```typescript
// src/infrastructure/database/repositories/prisma-book.repository.ts
import { PrismaClient } from '@prisma/client';
import { Book } from '@/domain/entities/book.entity';
import { BookId } from '@/domain/value-objects/book-id.vo';
import { UserId } from '@/domain/value-objects/user-id.vo';
import { BookStatus } from '@/domain/value-objects/book-status.vo';
import { BookRepository } from '@/domain/repositories/book.repository';
import { BookMapper } from '../mappers/book.mapper';

export class PrismaBookRepository implements BookRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(book: Book): Promise<Book> {
    const data = BookMapper.toPersistence(book);
    
    const existingBook = await this.prisma.book.findUnique({
      where: { id: book.id.getValue() }
    });

    if (existingBook) {
      const updated = await this.prisma.book.update({
        where: { id: book.id.getValue() },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
      return BookMapper.toDomain(updated);
    } else {
      const created = await this.prisma.book.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return BookMapper.toDomain(created);
    }
  }

  async findById(id: BookId): Promise<Book | null> {
    const book = await this.prisma.book.findUnique({
      where: { id: id.getValue() }
    });
    return book ? BookMapper.toDomain(book) : null;
  }

  async findByUserId(userId: UserId): Promise<Book[]> {
    const books = await this.prisma.book.findMany({
      where: { userId: userId.getValue() },
      orderBy: { updatedAt: 'desc' }
    });
    return books.map(BookMapper.toDomain);
  }

  async findByStatus(userId: UserId, status: BookStatus): Promise<Book[]> {
    const books = await this.prisma.book.findMany({
      where: { 
        userId: userId.getValue(),
        status: status
      },
      orderBy: { updatedAt: 'desc' }
    });
    return books.map(BookMapper.toDomain);
  }

  async delete(id: BookId): Promise<void> {
    await this.prisma.book.delete({
      where: { id: id.getValue() }
    });
  }

  async findByTitleAndAuthor(
    userId: UserId, 
    title: string, 
    author: string
  ): Promise<Book | null> {
    const book = await this.prisma.book.findFirst({
      where: {
        userId: userId.getValue(),
        title: {
          equals: title,
          mode: 'insensitive'
        },
        author: {
          equals: author,
          mode: 'insensitive'
        }
      }
    });
    return book ? BookMapper.toDomain(book) : null;
  }
}
```

### Data Mapper

```typescript
// src/infrastructure/database/mappers/book.mapper.ts
import { Book } from '@/domain/entities/book.entity';
import { BookId } from '@/domain/value-objects/book-id.vo';
import { UserId } from '@/domain/value-objects/user-id.vo';
import { BookStatus } from '@/domain/value-objects/book-status.vo';
import { Rating } from '@/domain/value-objects/rating.vo';

interface PrismaBook {
  id: string;
  userId: string;
  title: string;
  author: string;
  status: string;
  totalPages: number | null;
  currentPage: number | null;
  rating: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BookMapper {
  static toDomain(persistence: PrismaBook): Book {
    return Book.reconstitute({
      id: BookId.create(persistence.id),
      userId: UserId.create(persistence.userId),
      title: persistence.title,
      author: persistence.author,
      status: persistence.status as BookStatus,
      totalPages: persistence.totalPages || undefined,
      currentPage: persistence.currentPage || undefined,
      rating: persistence.rating ? Rating.create(persistence.rating) : undefined,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt
    });
  }

  static toPersistence(domain: Book) {
    return {
      id: domain.id.getValue(),
      userId: domain.userId.getValue(),
      title: domain.title,
      author: domain.author,
      status: domain.status,
      totalPages: domain.totalPages || null,
      currentPage: domain.currentPage || null,
      rating: domain.rating?.getValue() || null
    };
  }
}
```

### DI Container

```typescript
// src/infrastructure/di/container.ts
export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, any>();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not registered`);
    }
    return service;
  }

  // Boot method for dependency registration
  boot(): void {
    this.registerInfrastructureServices();
    this.registerApplicationServices();
  }

  private registerInfrastructureServices(): void {
    const prisma = new PrismaClient();
    this.register('prisma', prisma);
    this.register('bookRepository', new PrismaBookRepository(prisma));
    this.register('userRepository', new PrismaUserRepository(prisma));
    this.register('googleBooksService', new GoogleBooksService());
  }

  private registerApplicationServices(): void {
    this.register('addBookToLibraryUseCase', new AddBookToLibraryUseCase(
      this.get('bookRepository'),
      this.get('userRepository'),
      this.get('googleBooksService')
    ));
  }
}
```

## Presentation Layer の実装例

### Custom Hook

```typescript
// src/presentation/hooks/use-book-actions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DIContainer } from '@/infrastructure/di/container';
import { AddBookToLibraryUseCase } from '@/application/use-cases/book/add-book-to-library.use-case';
import { UpdateBookStatusUseCase } from '@/application/use-cases/book/update-book-status.use-case';
import { AddBookCommand } from '@/application/dto/commands/add-book.command';
import { UpdateBookStatusCommand } from '@/application/dto/commands/update-book-status.command';

export const useBookActions = () => {
  const queryClient = useQueryClient();
  const container = DIContainer.getInstance();

  const addBook = useMutation({
    mutationFn: async (command: AddBookCommand) => {
      const useCase = container.get<AddBookToLibraryUseCase>('addBookToLibraryUseCase');
      return useCase.execute(command);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      console.error('Failed to add book:', error);
    }
  });

  const updateStatus = useMutation({
    mutationFn: async (command: UpdateBookStatusCommand) => {
      const useCase = container.get<UpdateBookStatusUseCase>('updateBookStatusUseCase');
      return useCase.execute(command);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });

  return {
    addBook,
    updateStatus,
    isLoading: addBook.isPending || updateStatus.isPending
  };
};
```

### React Component

```typescript
// src/presentation/components/features/library/book-card.component.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Book } from '@/domain/entities/book.entity';
import { BookStatus } from '@/domain/value-objects/book-status.vo';
import { Rating } from '@/domain/value-objects/rating.vo';
import { BookStatusBadge } from '@/presentation/components/shared/book-status-badge.component';
import { RatingDisplay } from '@/presentation/components/shared/rating-display.component';
import { ProgressBar } from '@/presentation/components/shared/progress-bar.component';

interface BookCardProps {
  book: Book;
  onStatusUpdate: (bookId: string, status: BookStatus) => void;
  onRate: (bookId: string, rating: Rating) => void;
  onProgressUpdate: (bookId: string, currentPage: number) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onStatusUpdate,
  onRate,
  onProgressUpdate
}) => {
  const progress = book.getProgress();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">{book.title}</CardTitle>
        <CardDescription>{book.author}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <BookStatusBadge status={book.status} />
          
          {book.rating && (
            <RatingDisplay rating={book.rating} />
          )}
          
          {progress && (
            <ProgressBar 
              current={progress.getCurrentPage()}
              total={progress.getTotalPages()}
              onUpdate={(currentPage) => onProgressUpdate(book.id.getValue(), currentPage)}
            />
          )}
          
          <div className="flex justify-between items-center">
            <select
              value={book.status}
              onChange={(e) => onStatusUpdate(book.id.getValue(), e.target.value as BookStatus)}
              className="px-3 py-1 border rounded"
            >
              {Object.values(BookStatus).map(status => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            
            {book.status === BookStatus.COMPLETED && !book.rating && (
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => onRate(book.id.getValue(), Rating.create(value))}
                    className="text-gray-400 hover:text-yellow-400"
                  >
                    ★
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## テストの実装例

### Domain Test

```typescript
// __tests__/domain/entities/book.entity.test.ts
import { Book } from '@/domain/entities/book.entity';
import { BookId } from '@/domain/value-objects/book-id.vo';
import { UserId } from '@/domain/value-objects/user-id.vo';
import { BookStatus } from '@/domain/value-objects/book-status.vo';
import { Rating } from '@/domain/value-objects/rating.vo';

describe('Book Entity', () => {
  const userId = UserId.create('user-123');
  
  describe('create', () => {
    it('should create a new book with default status WANT_TO_READ', () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        userId,
        totalPages: 368
      });

      expect(book.title).toBe('Clean Architecture');
      expect(book.author).toBe('Robert C. Martin');
      expect(book.status).toBe(BookStatus.WANT_TO_READ);
      expect(book.totalPages).toBe(368);
      expect(book.userId).toBe(userId);
    });
  });

  describe('updateStatus', () => {
    it('should update status when transition is valid', () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        userId
      });

      book.updateStatus(BookStatus.READING);

      expect(book.status).toBe(BookStatus.READING);
    });

    it('should throw error when transition is invalid', () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        userId
      });

      expect(() => {
        book.updateStatus(BookStatus.COMPLETED);
      }).toThrow('Invalid status transition');
    });
  });

  describe('rate', () => {
    it('should allow rating when book is completed', () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        userId
      });

      book.updateStatus(BookStatus.READING);
      book.updateStatus(BookStatus.COMPLETED);
      
      const rating = Rating.create(5);
      book.rate(rating);

      expect(book.rating).toBe(rating);
    });

    it('should not allow rating when book is not completed', () => {
      const book = Book.create({
        title: 'Clean Architecture',
        author: 'Robert C. Martin',
        userId
      });

      const rating = Rating.create(5);

      expect(() => {
        book.rate(rating);
      }).toThrow('Book cannot be rated');
    });
  });
});
```

### Use Case Test

```typescript
// __tests__/application/use-cases/add-book-to-library.use-case.test.ts
import { AddBookToLibraryUseCase } from '@/application/use-cases/book/add-book-to-library.use-case';
import { AddBookCommand } from '@/application/dto/commands/add-book.command';
import { BookRepository } from '@/domain/repositories/book.repository';
import { UserRepository } from '@/domain/repositories/user.repository';
import { GoogleBooksService } from '@/application/ports/services/google-books.service';
import { UserId } from '@/domain/value-objects/user-id.vo';
import { User } from '@/domain/entities/user.entity';

describe('AddBookToLibraryUseCase', () => {
  let useCase: AddBookToLibraryUseCase;
  let mockBookRepository: jest.Mocked<BookRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockGoogleBooksService: jest.Mocked<GoogleBooksService>;

  beforeEach(() => {
    mockBookRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn()
    };

    mockUserRepository = {
      findById: jest.fn(),
      save: jest.fn()
    };

    mockGoogleBooksService = {
      getBookById: jest.fn()
    };

    useCase = new AddBookToLibraryUseCase(
      mockBookRepository,
      mockUserRepository,
      mockGoogleBooksService
    );
  });

  it('should add book to library successfully', async () => {
    // Arrange
    const userId = UserId.create('user-123');
    const user = User.create({ email: 'test@example.com', username: 'testuser' });
    const command = new AddBookCommand(
      userId,
      { title: 'Clean Architecture', author: 'Robert C. Martin' }
    );

    mockUserRepository.findById.mockResolvedValue(user);
    mockBookRepository.findByUserId.mockResolvedValue([]);
    mockBookRepository.save.mockImplementation(book => Promise.resolve(book));

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.book).toBeDefined();
    expect(result.book!.title).toBe('Clean Architecture');
    expect(mockBookRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw error when user not found', async () => {
    // Arrange
    const userId = UserId.create('user-123');
    const command = new AddBookCommand(
      userId,
      { title: 'Clean Architecture', author: 'Robert C. Martin' }
    );

    mockUserRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow('User not found');
  });
});
```

これらの実装例により、依存性逆転の原則に従った保守性の高いクリーンアーキテクチャを実現できます。